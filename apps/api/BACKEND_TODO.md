# Backend Implementation TODO - Newsletter System

## GraphQL Schema Additions Required

### Mutations

#### 1. Subscribe to Newsletter
```graphql
type Mutation {
  subscribeNewsletter(
    email: String!
    subscribedSectors: [String!]!
    frequency: NewsletterFrequency!
  ): NewsletterSubscriber!
}
```

**Implementation Notes:**
- Validate email format
- Check if email already exists (update if exists)
- Link to userId if user is authenticated (check JWT token)
- Set `isActive = true`
- Set `subscribedAt = now()`
- If user was previously unsubscribed, clear `unsubscribedAt`
- Return the created/updated subscription
- Send welcome email (trigger async job)

**Example:**
```typescript
async subscribeNewsletter(
  _parent: any,
  args: { email: string; subscribedSectors: string[]; frequency: NewsletterFrequency },
  context: GraphQLContext
) {
  const { email, subscribedSectors, frequency } = args;
  const userId = context.user?.id || null;

  // Validate email
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address');
  }

  // Check if subscription exists
  const existing = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  if (existing) {
    // Update existing subscription
    return await prisma.newsletterSubscriber.update({
      where: { email },
      data: {
        subscribedSectors,
        frequency,
        isActive: true,
        unsubscribedAt: null,
        userId,
      },
    });
  }

  // Create new subscription
  const subscription = await prisma.newsletterSubscriber.create({
    data: {
      email,
      subscribedSectors,
      frequency,
      isActive: true,
      userId,
    },
  });

  // Send welcome email (async)
  await emailService.sendWelcomeEmail(subscription);

  return subscription;
}
```

---

#### 2. Unsubscribe from Newsletter
```graphql
type Mutation {
  unsubscribeNewsletter(email: String!): UnsubscribeResult!
}

type UnsubscribeResult {
  success: Boolean!
  message: String
}
```

**Implementation Notes:**
- Find subscription by email
- Set `isActive = false`
- Set `unsubscribedAt = now()`
- Return success result
- No authentication required (email link)
- Rate limit to prevent abuse

**Example:**
```typescript
async unsubscribeNewsletter(
  _parent: any,
  args: { email: string },
  context: GraphQLContext
) {
  const { email } = args;

  const subscription = await prisma.newsletterSubscriber.findUnique({
    where: { email },
  });

  if (!subscription) {
    return {
      success: false,
      message: 'No subscription found for this email',
    };
  }

  await prisma.newsletterSubscriber.update({
    where: { email },
    data: {
      isActive: false,
      unsubscribedAt: new Date(),
    },
  });

  return {
    success: true,
    message: 'Successfully unsubscribed',
  };
}
```

---

#### 3. Update Newsletter Preferences
```graphql
type Mutation {
  updateNewsletterPreferences(
    subscribedSectors: [String!]!
    frequency: NewsletterFrequency!
  ): NewsletterSubscriber!
}
```

**Implementation Notes:**
- Requires authentication (get userId from context)
- Find subscription by userId
- Update sectors and frequency
- Return updated subscription
- Send confirmation email (optional)

**Example:**
```typescript
async updateNewsletterPreferences(
  _parent: any,
  args: { subscribedSectors: string[]; frequency: NewsletterFrequency },
  context: GraphQLContext
) {
  const userId = context.user?.id;
  if (!userId) {
    throw new Error('Authentication required');
  }

  const subscription = await prisma.newsletterSubscriber.findUnique({
    where: { userId },
  });

  if (!subscription) {
    throw new Error('No subscription found');
  }

  return await prisma.newsletterSubscriber.update({
    where: { userId },
    data: {
      subscribedSectors: args.subscribedSectors,
      frequency: args.frequency,
    },
  });
}
```

---

#### 4. Increment Report View
```graphql
type Mutation {
  incrementReportView(slug: String!): ReportViewResult!
}

type ReportViewResult {
  id: ID!
  viewCount: Int!
}
```

**Implementation Notes:**
- Find report by slug
- Increment viewCount by 1
- Return updated report
- No authentication required
- Consider rate limiting (1 increment per IP per hour per report)

**Example:**
```typescript
async incrementReportView(
  _parent: any,
  args: { slug: string },
  context: GraphQLContext
) {
  const report = await prisma.weeklyReport.findUnique({
    where: { slug: args.slug },
  });

  if (!report) {
    throw new Error('Report not found');
  }

  // Optional: Check rate limit using IP address
  const ip = context.req.ip;
  const key = `report_view:${report.id}:${ip}`;
  const viewed = await redis.get(key);

  if (viewed) {
    return { id: report.id, viewCount: report.viewCount };
  }

  // Increment view count
  const updated = await prisma.weeklyReport.update({
    where: { id: report.id },
    data: { viewCount: { increment: 1 } },
  });

  // Set rate limit (1 hour)
  await redis.setex(key, 3600, '1');

  return { id: updated.id, viewCount: updated.viewCount };
}
```

---

### Queries

#### 1. Get Newsletter Preferences
```graphql
type Query {
  myNewsletterPreferences: NewsletterSubscriber
}
```

**Implementation Notes:**
- Requires authentication
- Return subscription linked to current user
- Return null if not subscribed

**Example:**
```typescript
async myNewsletterPreferences(
  _parent: any,
  _args: any,
  context: GraphQLContext
) {
  const userId = context.user?.id;
  if (!userId) {
    throw new Error('Authentication required');
  }

  return await prisma.newsletterSubscriber.findUnique({
    where: { userId },
  });
}
```

---

#### 2. Get Latest Reports
```graphql
type Query {
  latestReports(limit: Int!): [WeeklyReport!]!
}
```

**Implementation Notes:**
- Return published reports only (`isPublished = true`)
- Order by `publishedAt DESC`
- Limit by provided limit (max 10)
- Include sector information
- Include view count

**Example:**
```typescript
async latestReports(
  _parent: any,
  args: { limit: number },
  context: GraphQLContext
) {
  const limit = Math.min(args.limit, 10); // Max 10

  return await prisma.weeklyReport.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: { sector: true },
  });
}
```

---

## Types

```graphql
type NewsletterSubscriber {
  id: ID!
  userId: ID
  email: String!
  subscribedSectors: [String!]!
  frequency: NewsletterFrequency!
  isActive: Boolean!
  subscribedAt: DateTime!
  unsubscribedAt: DateTime
}

type WeeklyReport {
  id: ID!
  title: String!
  slug: String!
  reportType: ReportType!
  sector: Sector
  summary: String!
  publishedAt: DateTime
  viewCount: Int!
}

enum NewsletterFrequency {
  WEEKLY
  DAILY
}

enum ReportType {
  SECTOR_WEEKLY
  MACRO_WEEKLY
}
```

---

## Email Service Implementation

### 1. Welcome Email
**Template:** `/apps/analytics/templates/email/welcome_newsletter.html`

**Function:**
```typescript
async sendWelcomeEmail(subscription: NewsletterSubscriber) {
  const template = await loadTemplate('welcome_newsletter.html');

  const sectors = subscription.subscribedSectors.join(', ');
  const nextDelivery = getNextDeliveryDate(subscription.frequency);

  const html = template
    .replace('{{EMAIL}}', subscription.email)
    .replace('{{FREQUENCY}}', subscription.frequency.toLowerCase())
    .replace('{{SECTORS}}', sectors)
    .replace('{{NEXT_DELIVERY}}', nextDelivery)
    .replace('{{PLATFORM_URL}}', config.platformUrl)
    .replace('{{PREFERENCES_URL}}', `${config.platformUrl}/settings/newsletter`)
    .replace('{{UNSUBSCRIBE_URL}}', `${config.platformUrl}/newsletter/unsubscribe?email=${subscription.email}`)
    .replace('{{YEAR}}', new Date().getFullYear().toString());

  await sendGrid.send({
    to: subscription.email,
    from: 'reports@alphasignal.com',
    subject: 'Welcome to Alpha Signal Intelligence',
    html,
  });
}
```

---

### 2. Weekly Report Email
**Template:** `/apps/analytics/templates/email/weekly_report.html`

**Function:**
```typescript
async sendWeeklyReportEmail(
  subscription: NewsletterSubscriber,
  report: WeeklyReport
) {
  const template = await loadTemplate('weekly_report.html');

  const reportType = report.reportType === 'MACRO_WEEKLY'
    ? 'MACRO WEEKLY'
    : report.sector?.name || 'SECTOR WEEKLY';

  const keyInsights = extractKeyInsights(report.fullContent);

  const html = template
    .replace('{{REPORT_TYPE}}', reportType)
    .replace('{{REPORT_TITLE}}', report.title)
    .replace('{{REPORT_SUMMARY}}', report.summary)
    .replace('{{REPORT_URL}}', `${config.platformUrl}/reports/${report.slug}`)
    .replace('{{KEY_INSIGHTS}}', renderInsightsList(keyInsights))
    .replace('{{PREFERENCES_URL}}', `${config.platformUrl}/settings/newsletter`)
    .replace('{{UNSUBSCRIBE_URL}}', `${config.platformUrl}/newsletter/unsubscribe?email=${subscription.email}`)
    .replace('{{YEAR}}', new Date().getFullYear().toString());

  await sendGrid.send({
    to: subscription.email,
    from: 'reports@alphasignal.com',
    subject: report.title,
    html,
  });
}
```

---

## Cron Jobs

### 1. Weekly Report Delivery
**Schedule:** Every Monday at 6:00 AM IST

```typescript
// cron: 0 6 * * MON (UTC+5:30)
async function sendWeeklyReports() {
  // Get latest published macro report
  const macroReport = await prisma.weeklyReport.findFirst({
    where: {
      reportType: 'MACRO_WEEKLY',
      isPublished: true,
    },
    orderBy: { publishedAt: 'desc' },
  });

  // Get active WEEKLY subscribers
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: {
      isActive: true,
      frequency: 'WEEKLY',
    },
  });

  // Get latest sector reports
  const sectorReports = await prisma.weeklyReport.findMany({
    where: {
      reportType: 'SECTOR_WEEKLY',
      isPublished: true,
    },
    orderBy: { publishedAt: 'desc' },
    include: { sector: true },
  });

  // Queue emails
  for (const subscriber of subscribers) {
    // Send macro report
    if (macroReport) {
      await queueEmail(subscriber, macroReport);
    }

    // Send sector reports for subscribed sectors
    for (const report of sectorReports) {
      if (
        report.sector &&
        subscriber.subscribedSectors.includes(report.sector.name.toUpperCase())
      ) {
        await queueEmail(subscriber, report);
      }
    }
  }
}
```

---

### 2. Daily Report Delivery
**Schedule:** Every day at 8:00 AM IST

```typescript
// cron: 0 8 * * * (UTC+5:30)
async function sendDailyReports() {
  // Get reports published in last 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const reports = await prisma.weeklyReport.findMany({
    where: {
      isPublished: true,
      publishedAt: { gte: yesterday },
    },
    include: { sector: true },
  });

  if (reports.length === 0) return;

  // Get active DAILY subscribers
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: {
      isActive: true,
      frequency: 'DAILY',
    },
  });

  // Queue emails
  for (const subscriber of subscribers) {
    for (const report of reports) {
      // Check if macro or if sector matches
      const shouldSend =
        report.reportType === 'MACRO_WEEKLY' ||
        (report.sector &&
          subscriber.subscribedSectors.includes(report.sector.name.toUpperCase()));

      if (shouldSend) {
        await queueEmail(subscriber, report);
      }
    }
  }
}
```

---

### 3. Newsletter Queue Processor
**Schedule:** Every 5 minutes

```typescript
// cron: */5 * * * *
async function processNewsletterQueue() {
  const pending = await prisma.newsletterQueue.findMany({
    where: { sentAt: null, scheduledFor: { lte: new Date() } },
    take: 100, // Process 100 at a time
    include: {
      subscriber: true,
      report: true,
    },
  });

  for (const item of pending) {
    try {
      await sendWeeklyReportEmail(item.subscriber, item.report);

      // Mark as sent
      await prisma.newsletterQueue.update({
        where: { id: item.id },
        data: { sentAt: new Date() },
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      // Update error count or mark as failed
    }
  }
}
```

---

## Rate Limiting

### Subscription Rate Limit
- 5 subscriptions per IP per hour
- Prevent spam/abuse

```typescript
const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: 'Too many subscription attempts, please try again later',
});

app.use('/graphql', rateLimiter);
```

### View Tracking Rate Limit
- 1 view increment per IP per report per hour
- Prevent view count manipulation

```typescript
// Implemented in incrementReportView resolver using Redis
```

---

## Testing

### Unit Tests
- [ ] Test subscribeNewsletter mutation
- [ ] Test unsubscribeNewsletter mutation
- [ ] Test updateNewsletterPreferences mutation
- [ ] Test incrementReportView mutation
- [ ] Test myNewsletterPreferences query
- [ ] Test latestReports query

### Integration Tests
- [ ] Test welcome email sending
- [ ] Test weekly report email sending
- [ ] Test unsubscribe flow
- [ ] Test preferences update flow
- [ ] Test cron job execution

### E2E Tests
- [ ] Subscribe from frontend
- [ ] Update preferences
- [ ] Unsubscribe via email link
- [ ] View report and track view count

---

## Environment Variables

```env
# Email Service
SENDGRID_API_KEY=your_sendgrid_api_key
EMAIL_FROM=reports@alphasignal.com

# Platform URLs
PLATFORM_URL=https://alphasignal.com

# Rate Limiting
REDIS_URL=redis://localhost:6379
```

---

## Deployment Checklist

- [ ] Run database migrations
- [ ] Set up SendGrid account and API key
- [ ] Configure cron jobs on server
- [ ] Set up Redis for rate limiting
- [ ] Test email delivery in staging
- [ ] Test all GraphQL operations
- [ ] Deploy to production
- [ ] Monitor email delivery rates
- [ ] Set up alerts for failed emails

---

## Monitoring

### Metrics to Track
- Newsletter subscriptions per day
- Unsubscribe rate
- Email open rate (if tracking pixel added)
- Email click rate (if UTM parameters added)
- Report view counts
- Failed email deliveries

### Alerts
- Alert if email delivery failure rate > 5%
- Alert if unsubscribe rate > 10% per batch
- Alert if cron job fails

---

**Next Steps:**
1. Implement GraphQL resolvers
2. Set up SendGrid integration
3. Create cron jobs
4. Test thoroughly in staging
5. Deploy to production
