from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from app.database.database import Base


class DemandForecast(Base):

    __tablename__ = "demand_forecasts"

    __table_args__ = (
        UniqueConstraint(
            "companyId",
            "productId",
            "forecastPeriod",
            name="uq_company_product_forecast_period",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    companyId = Column(
        "companyId",
        Integer,
        nullable=False,
        index=True,
    )

    productId = Column(
        "productId",
        Integer,
        ForeignKey(
            "products.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    categoryId = Column(
        "categoryId",
        Integer,
        ForeignKey(
            "categories.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    forecastPeriod = Column(
        "forecastPeriod",
        String(30),
        nullable=False,
    )

    predictedDemand = Column(
        "predictedDemand",
        Float,
        nullable=False,
    )

    confidenceScore = Column(
        "confidenceScore",
        Float,
        nullable=False,
        default=0,
    )

    generatedAt = Column(
        "generatedAt",
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    product = relationship(
        "Product",
        backref="demand_forecasts",
    )

    category = relationship(
        "Category",
        backref="demand_forecasts",
    )