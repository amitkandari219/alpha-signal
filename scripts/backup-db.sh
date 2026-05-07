#!/bin/bash

# Backup Alpha Signal Production Database
# This script creates a compressed PostgreSQL backup with timestamp

set -e

echo "💾 Starting database backup..."
echo ""

# Configuration
BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="alphasignal_backup_${TIMESTAMP}.sql"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
COMPRESSED_FILE="${BACKUP_PATH}.gz"
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform database backup
echo "📦 Creating database dump..."
pg_dump -h postgres -U alphasignal -d alphasignal -F p -f $BACKUP_PATH

if [ $? -eq 0 ]; then
    echo "✅ Database dump created: $BACKUP_FILE"
else
    echo "❌ Database dump failed!"
    exit 1
fi

# Compress the backup
echo "🗜️  Compressing backup..."
gzip $BACKUP_PATH

if [ $? -eq 0 ]; then
    echo "✅ Backup compressed: ${BACKUP_FILE}.gz"
else
    echo "❌ Compression failed!"
    exit 1
fi

# Get file size
BACKUP_SIZE=$(du -h $COMPRESSED_FILE | cut -f1)
echo "📊 Backup size: $BACKUP_SIZE"

# Delete old backups (keep last 7 days)
echo "🧹 Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
find $BACKUP_DIR -name "alphasignal_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
REMAINING_BACKUPS=$(ls -1 $BACKUP_DIR/alphasignal_backup_*.sql.gz 2>/dev/null | wc -l)
echo "📁 Total backups retained: $REMAINING_BACKUPS"

echo ""
echo "✅ Backup completed successfully!"
echo "   File: ${BACKUP_FILE}.gz"
echo "   Size: $BACKUP_SIZE"
echo "   Location: $BACKUP_DIR"
echo ""

# Optional: Upload to S3 (uncomment if AWS is configured)
# if [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
#     echo "☁️  Uploading to S3..."
#     aws s3 cp $COMPRESSED_FILE s3://${BACKUP_S3_BUCKET}/backups/
#     echo "✅ Uploaded to S3"
# fi
