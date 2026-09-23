from sqlalchemy import text
from app.database.database import engine

def migrate():
    with engine.connect() as conn:
        print("Starting audit_logs table migration...")
        columns_to_add = [
            ("userId", "INTEGER"),
            ("userName", "VARCHAR(150)"),
            ("userEmail", "VARCHAR(150)"),
            ("resourceType", "VARCHAR(100) DEFAULT 'System'"),
            ("resourceId", "INTEGER"),
            ("description", "TEXT"),
            ("ipAddress", "VARCHAR(100)"),
            ("userAgent", "TEXT"),
            ("beforeData", "TEXT"),
            ("afterData", "TEXT"),
            ("status", "VARCHAR(50) DEFAULT 'SUCCESS'"),
            ("createdAt", "TIMESTAMP WITH TIME ZONE DEFAULT NOW()")
        ]
        
        for col_name, col_type in columns_to_add:
            conn.execute(text(f'ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS "{col_name}" {col_type};'))
        
        conn.execute(text('''
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='audit_logs' AND column_name='timestamp'
                ) THEN
                    UPDATE audit_logs SET "createdAt" = "timestamp" WHERE "createdAt" IS NULL;
                END IF;
            END $$;
        '''))
        
        conn.execute(text("UPDATE audit_logs SET \"status\" = 'SUCCESS' WHERE \"status\" IS NULL;"))
        conn.execute(text("UPDATE audit_logs SET \"resourceType\" = 'System' WHERE \"resourceType\" IS NULL;"))
        
        conn.execute(text('''
            UPDATE audit_logs
            SET "userId" = 1, "userName" = 'MadhuSudhanan', "userEmail" = 'madhu4117@gmail.com'
            WHERE "userId" IS NULL;
        '''))
        
        conn.execute(text('''
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='audit_logs' AND column_name='targetName'
                ) THEN
                    UPDATE audit_logs 
                    SET "description" = COALESCE("action", '') || ' on ' || COALESCE("targetName", '')
                    WHERE "description" IS NULL;
                END IF;
            END $$;
        '''))

        indexes = [
            ("ix_audit_logs_companyId", '"companyId"'),
            ("ix_audit_logs_userId", '"userId"'),
            ("ix_audit_logs_action", '"action"'),
            ("ix_audit_logs_resourceType", '"resourceType"'),
            ("ix_audit_logs_resourceId", '"resourceId"'),
            ("ix_audit_logs_status", '"status"'),
            ("ix_audit_logs_createdAt", '"createdAt"')
        ]
        for idx_name, col in indexes:
            conn.execute(text(f'CREATE INDEX IF NOT EXISTS {idx_name} ON audit_logs ({col});'))

        conn.commit()
        print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
