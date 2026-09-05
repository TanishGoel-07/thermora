from __future__ import annotations

from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.alert import Alert, AlertLevel, AlertDelivery, AlertChannel
from app.models.user import User
from app.alerts.notifiers import send_sms, send_email, send_push

settings = get_settings()

_LEVEL_FOR_CATEGORY = {
    "Safe": AlertLevel.SAFE,
    "Caution": AlertLevel.CAUTION,
    "Danger": AlertLevel.DANGER,
    "Extreme Danger": AlertLevel.EXTREME_DANGER,
}


def maybe_create_alert(
    db: Session, ward_id: int, htsi_score: float, htsi_category: str, recommendation: str
) -> Alert | None:
    """Creates (and dispatches) an alert if htsi_score crosses the configured threshold."""
    if htsi_score < settings.ALERT_RISK_THRESHOLD:
        return None

    level = _LEVEL_FOR_CATEGORY.get(htsi_category, AlertLevel.CAUTION)
    title = f"{htsi_category} Heat Alert"
    message = (
        f"Human Thermal Stress Index has reached {htsi_score}/100 "
        f"({htsi_category}) in your ward."
    )

    alert = Alert(
        ward_id=ward_id,
        level=level,
        htsi_score=htsi_score,
        title=title,
        message=message,
        recommended_action=recommendation,
        is_active=True,
        expires_at=datetime.utcnow() + timedelta(hours=12),
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    dispatch_alert(db, alert)
    return alert


def dispatch_alert(db: Session, alert: Alert) -> None:
    """Fan out the alert to all users registered in the affected ward."""
    users = db.query(User).filter(User.ward_id == alert.ward_id, User.is_active.is_(True)).all()

    for user in users:
        channels = [AlertChannel.PUSH]
        if user.email:
            channels.append(AlertChannel.EMAIL)
        if user.phone_number:
            channels.append(AlertChannel.SMS)

        for channel in channels:
            delivery = AlertDelivery(alert_id=alert.id, user_id=user.id, channel=channel, status="pending")
            db.add(delivery)
            db.flush()

            try:
                if channel == AlertChannel.SMS:
                    send_sms(user.phone_number, alert.message)
                elif channel == AlertChannel.EMAIL:
                    send_email(user.email, alert.title, alert.message)
                elif channel == AlertChannel.PUSH:
                    send_push(user.id, alert.title, alert.message)
                delivery.status = "sent"
                delivery.sent_at = datetime.utcnow()
            except Exception as exc:  # noqa: BLE001
                delivery.status = "failed"
                delivery.error_message = str(exc)

    db.commit()
