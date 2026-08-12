from sqlalchemy import (
    Column,
    Integer,
    Float,
    DateTime,
    ForeignKey,
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class ForecastHistory(Base):

    __tablename__ = "forecast_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    forecastId = Column(
        "forecastId",
        Integer,
        ForeignKey(
            "demand_forecasts.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    historicalSales = Column(
        "historicalSales",
        Float,
        nullable=False,
    )

    prediction = Column(
        Float,
        nullable=False,
    )

    accuracy = Column(
        Float,
        nullable=True,
    )

    createdAt = Column(
        "createdAt",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    forecast = relationship(
        "DemandForecast",
        backref="history",
    )