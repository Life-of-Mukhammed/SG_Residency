export const GTM_PROMPTS = [
  // Social Media Content
  { id: 1, category: 'Social Media', type: 'LinkedIn', prompt: 'Share a "behind the scenes" look at how your team solved [specific technical challenge]. Include what failed first.' },
  { id: 2, category: 'Social Media', type: 'LinkedIn', prompt: 'Write about a customer who used your product in a way you never expected. What did you learn?' },
  { id: 3, category: 'Social Media', type: 'Twitter/X', prompt: 'Share 5 counterintuitive lessons from building [your startup]. Each must surprise people.' },
  { id: 4, category: 'Social Media', type: 'Twitter/X', prompt: 'Post your MRR milestone journey. Show the chart. Tell the honest story including the dips.' },
  { id: 5, category: 'Social Media', type: 'Instagram', prompt: 'Visual story: Show your workspace, team, and the product in one cohesive aesthetic post.' },
  { id: 6, category: 'Social Media', type: 'LinkedIn', prompt: 'Write about a mistake you made in hiring/firing and what you learned from it.' },
  { id: 7, category: 'Social Media', type: 'Twitter/X', prompt: 'Thread: "Everything I know about [your domain] that I wish someone told me 2 years ago"' },
  { id: 8, category: 'Social Media', type: 'LinkedIn', prompt: 'Share a framework you use internally that others could apply to their work.' },
  { id: 9, category: 'Social Media', type: 'Twitter/X', prompt: 'Honest take: Why most [your industry] companies fail. What you do differently.' },
  { id: 10, category: 'Social Media', type: 'LinkedIn', prompt: 'Celebrate a team member. Tell the specific story of how they made your company better.' },
  // Email Marketing
  { id: 11, category: 'Email', type: 'Newsletter', prompt: 'Monthly founder letter: What worked, what didn\'t, and what you\'re doubling down on next month.' },
  { id: 12, category: 'Email', type: 'Nurture', prompt: 'Email to inactive users: "We noticed you haven\'t logged in. Here\'s what you\'re missing + one thing we fixed based on your feedback."' },
  { id: 13, category: 'Email', type: 'Onboarding', prompt: 'Day 1 email: Welcome + the ONE thing they should do in the first 10 minutes to get value.' },
  { id: 14, category: 'Email', type: 'Onboarding', prompt: 'Day 3 email: "Most users who succeed do this one thing on day 3. Here\'s exactly how."' },
  { id: 15, category: 'Email', type: 'Onboarding', prompt: 'Day 7 email: Share a success story from a user similar to them. Include specific metrics.' },
  { id: 16, category: 'Email', type: 'Sales', prompt: 'Cold outreach: Research their company, identify a specific pain, connect it to your solution in 3 sentences.' },
  { id: 17, category: 'Email', type: 'Retention', prompt: 'Re-engagement: "You were our most active user in [month]. Come see what\'s changed since then."' },
  { id: 18, category: 'Email', type: 'Newsletter', prompt: 'Curate 5 resources in your domain that are genuinely useful. Add your unique commentary on each.' },
  { id: 19, category: 'Email', type: 'Upsell', prompt: 'Upgrade email: Show usage data for their account. Show what unlock next tier would mean for them specifically.' },
  { id: 20, category: 'Email', type: 'Newsletter', prompt: 'Case study email: One customer, before/after metrics, specific use case, direct quote.' },
  // Content Marketing
  { id: 21, category: 'Content', type: 'Blog', prompt: 'Write "The complete guide to [your core problem]" - 2000 words targeting high-intent keyword.' },
  { id: 22, category: 'Content', type: 'Blog', prompt: 'Comparison post: "[Your product] vs [Competitor]" - be honest, show where they\'re better too.' },
  { id: 23, category: 'Content', type: 'Video', prompt: 'Product demo video: Show real use case with real data. No voiceover, let the product speak.' },
  { id: 24, category: 'Content', type: 'Blog', prompt: '"How [Famous Company] would use [your product]" - fictional but realistic deep dive.' },
  { id: 25, category: 'Content', type: 'Podcast', prompt: 'Guest on a podcast in your niche. Pitch: "I\'ll share data from [X customers] about [surprising insight]."' },
  { id: 26, category: 'Content', type: 'Blog', prompt: 'Original research: Survey 50 users in your domain. Publish the data with your analysis.' },
  { id: 27, category: 'Content', type: 'Video', prompt: 'YouTube: "Day in the life of a [your target user] using [your product]" - follow a real customer.' },
  { id: 28, category: 'Content', type: 'Blog', prompt: '"I tried [competing approach] for 30 days. Here\'s what happened." Include hard numbers.' },
  { id: 29, category: 'Content', type: 'Blog', prompt: 'SEO post: Target "[competitor] alternative" — capture high-intent switching traffic.' },
  { id: 30, category: 'Content', type: 'Video', prompt: 'Tutorial video: Solve a specific problem your target user Googles. Make it genuinely the best resource.' },
  // Community & Partnership
  { id: 31, category: 'Community', type: 'Partnership', prompt: 'Find a non-competing tool your users also use. Propose a co-marketing campaign.' },
  { id: 32, category: 'Community', type: 'Forum', prompt: 'Answer 10 questions on Reddit/forums in your domain this week. No promotion, just genuine help.' },
  { id: 33, category: 'Community', type: 'Event', prompt: 'Host a free webinar on your core topic. Invite your best customer as the star speaker.' },
  { id: 34, category: 'Community', type: 'Partnership', prompt: 'Launch an affiliate program. Start with your top 10 users and offer generous commission.' },
  { id: 35, category: 'Community', type: 'Forum', prompt: 'Start a weekly thread in your community: "Share your win this week." You go first.' },
  // Paid Acquisition
  { id: 36, category: 'Paid', type: 'Google Ads', prompt: 'Create 3 ad variations targeting "[problem] solution" keywords. Test emotional vs logical copy.' },
  { id: 37, category: 'Paid', type: 'LinkedIn Ads', prompt: 'Run a LinkedIn lead gen campaign targeting [job title] at [company size]. Offer a relevant lead magnet.' },
  { id: 38, category: 'Paid', type: 'Retargeting', prompt: 'Retarget pricing page visitors who didn\'t convert with a "still thinking about it?" ad + social proof.' },
  { id: 39, category: 'Paid', type: 'Facebook Ads', prompt: 'Lookalike audience campaign based on your top 20 customers. Test 3 creatives with different angles.' },
  { id: 40, category: 'Paid', type: 'Influencer', prompt: 'Find 5 micro-influencers (5K-50K followers) in your niche. Offer product + small fee for authentic review.' },
];

export const CAMPAIGN_TEMPLATES = [
  {
    id: 'product-launch',
    name: 'Product Launch Campaign',
    duration: '4 weeks',
    channels: ['Email', 'Social Media', 'PR'],
    phases: [
      { week: 1, name: 'Teaser', tasks: ['Create countdown page', 'Begin social teasers', 'Brief key press contacts'] },
      { week: 2, name: 'Build-up', tasks: ['Launch waitlist', 'Share behind-scenes content', 'Partner announcement'] },
      { week: 3, name: 'Launch', tasks: ['Product goes live', 'Press embargo lift', 'Email blast to list'] },
      { week: 4, name: 'Amplify', tasks: ['Customer stories', 'Paid amplification', 'Community events'] },
    ],
  },
  {
    id: 'growth-sprint',
    name: '30-Day Growth Sprint',
    duration: '4 weeks',
    channels: ['Content', 'SEO', 'Community'],
    phases: [
      { week: 1, name: 'Foundation', tasks: ['Audit current traffic', 'Identify top 5 keywords', 'Publish 2 cornerstone pieces'] },
      { week: 2, name: 'Distribution', tasks: ['Guest posting outreach', 'Social amplification', 'Community engagement x20/day'] },
      { week: 3, name: 'Conversion', tasks: ['Optimize landing pages', 'A/B test CTAs', 'Implement lead magnets'] },
      { week: 4, name: 'Measure & Iterate', tasks: ['Review analytics', 'Double down on winners', 'Kill underperformers'] },
    ],
  },
  {
    id: 'enterprise-outbound',
    name: 'Enterprise Outbound Campaign',
    duration: '6 weeks',
    channels: ['Email', 'LinkedIn', 'Phone'],
    phases: [
      { week: 1, name: 'ICP Definition', tasks: ['Define ideal customer profile', 'Build target list of 50 companies', 'Research each company'] },
      { week: 2, name: 'Outreach Start', tasks: ['Send personalized emails to 50', 'LinkedIn connect + message', 'Track open/reply rates'] },
      { week: 3, name: 'Follow-up', tasks: ['Day 7 follow-up sequence', 'Value-add content touchpoints', 'Phone calls to openers'] },
      { week: 4, name: 'Discovery Calls', tasks: ['Conduct 10+ discovery calls', 'Qualify prospects', 'Customize demo deck'] },
      { week: 5, name: 'Demos', tasks: ['Run 5+ product demos', 'Send proposals', 'Handle objections'] },
      { week: 6, name: 'Close', tasks: ['Follow up on proposals', 'Legal/contract review', 'Onboarding preparation'] },
    ],
  },
];

export const KPI_METRICS = [
  { id: 'mrr', name: 'Monthly Recurring Revenue', unit: '$', target: 10000, description: 'Total predictable monthly revenue' },
  { id: 'arr', name: 'Annual Recurring Revenue', unit: '$', target: 120000, description: 'MRR x 12' },
  { id: 'churn', name: 'Churn Rate', unit: '%', target: 5, description: 'Monthly customer churn percentage' },
  { id: 'cac', name: 'Customer Acquisition Cost', unit: '$', target: 100, description: 'Total spend / new customers' },
  { id: 'ltv', name: 'Lifetime Value', unit: '$', target: 1200, description: 'Average revenue per user over lifetime' },
  { id: 'nps', name: 'Net Promoter Score', unit: '', target: 50, description: 'Customer satisfaction score' },
  { id: 'dau', name: 'Daily Active Users', unit: '', target: 500, description: 'Users active in last 24 hours' },
  { id: 'conversion', name: 'Trial to Paid Conversion', unit: '%', target: 25, description: 'Free to paid conversion rate' },
];

export const DAILY_SYSTEM = [
  { time: '08:00', task: 'Check metrics dashboard', duration: '15 min', priority: 'high' },
  { time: '08:15', task: 'Reply to urgent customer messages', duration: '30 min', priority: 'high' },
  { time: '08:45', task: 'Team standup', duration: '15 min', priority: 'high' },
  { time: '09:00', task: 'Deep work block (product/code)', duration: '3 hours', priority: 'critical' },
  { time: '12:00', task: 'Lunch + mindful break', duration: '1 hour', priority: 'medium' },
  { time: '13:00', task: 'Sales calls / demos', duration: '2 hours', priority: 'high' },
  { time: '15:00', task: 'Marketing / content creation', duration: '1 hour', priority: 'medium' },
  { time: '16:00', task: 'Admin, emails, async communication', duration: '1 hour', priority: 'low' },
  { time: '17:00', task: 'Review progress vs daily goals', duration: '15 min', priority: 'medium' },
  { time: '17:15', task: 'Plan tomorrow\'s top 3 priorities', duration: '15 min', priority: 'high' },
];
