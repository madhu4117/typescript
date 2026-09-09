from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
)

from app.database.database import Base


class ImportError(Base):
    __tablename__ = "import_errors"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    import_id = Column(
        Integer,
        ForeignKey(
            "import_history.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    row_number = Column(
        Integer,
        nullable=False
    )

    error_type = Column(
        String(100),
        nullable=False
    )

    field = Column(
        String(100),
        nullable=True
    )

    error_message = Column(
        Text,
        nullable=False
    )

    row_data = Column(
        Text,
        nullable=True
    )