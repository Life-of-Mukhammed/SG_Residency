export interface Task {
  id: string;
  title: string;
  description: string;
}

export interface Month {
  id: string;
  name: string;
  tasks: Task[];
}

export interface Quarter {
  id: string;
  name: string;
  months: Month[];
}

export const SPRINT_ROADMAP: Quarter[] = [
  {
    id: 'q1',
    name: 'Q1 — Foundation',
    months: [
      {
        id: 'q1m1',
        name: 'Month 1 — Discovery',
        tasks: [
          { id: 'q1m1t1', title: 'Define core problem & target user', description: 'Clearly articulate the problem your startup solves and who your primary user is.' },
          { id: 'q1m1t2', title: 'Competitive landscape analysis', description: 'Map all competitors, their strengths/weaknesses, and your differentiation.' },
          { id: 'q1m1t3', title: 'Conduct 10 user interviews', description: 'Talk to real potential customers to validate assumptions.' },
          { id: 'q1m1t4', title: 'Create user personas', description: 'Build 2-3 detailed personas based on interview insights.' },
          { id: 'q1m1t5', title: 'Define unique value proposition', description: 'Craft a one-liner that captures your core value.' },
        ],
      },
      {
        id: 'q1m2',
        name: 'Month 2 — Validation',
        tasks: [
          { id: 'q1m2t1', title: 'Build MVP scope document', description: 'List the minimum features needed to test your hypothesis.' },
          { id: 'q1m2t2', title: 'Create landing page', description: 'Build a landing page explaining your product to collect emails.' },
          { id: 'q1m2t3', title: 'Launch waitlist campaign', description: 'Drive 100+ signups using organic channels.' },
          { id: 'q1m2t4', title: 'Validate pricing hypothesis', description: 'Test pricing with potential customers before building.' },
          { id: 'q1m2t5', title: 'Set up analytics (Mixpanel/Amplitude)', description: 'Instrument your product for data-driven decisions.' },
        ],
      },
      {
        id: 'q1m3',
        name: 'Month 3 — Build',
        tasks: [
          { id: 'q1m3t1', title: 'Complete MVP development', description: 'Ship the core product with must-have features only.' },
          { id: 'q1m3t2', title: 'Onboard first 10 beta users', description: 'Get real users using your product daily.' },
          { id: 'q1m3t3', title: 'Collect and prioritize feedback', description: 'Document all feedback and triage by impact.' },
          { id: 'q1m3t4', title: 'Achieve first paying customer', description: 'Get someone to pay money for your product.' },
          { id: 'q1m3t5', title: 'Document product-market fit signals', description: 'Identify early indicators of PMF.' },
        ],
      },
    ],
  },
  {
    id: 'q2',
    name: 'Q2 — Growth',
    months: [
      {
        id: 'q2m1',
        name: 'Month 4 — Traction',
        tasks: [
          { id: 'q2m1t1', title: 'Define growth channels', description: 'Identify top 3 acquisition channels to test.' },
          { id: 'q2m1t2', title: 'Build content strategy', description: 'Create a 90-day content calendar.' },
          { id: 'q2m1t3', title: 'Launch referral program', description: 'Implement a mechanism for users to invite others.' },
          { id: 'q2m1t4', title: 'Reach 100 active users', description: 'Scale from 10 to 100 active monthly users.' },
          { id: 'q2m1t5', title: 'Optimize onboarding funnel', description: 'Improve activation rate by 20%.' },
        ],
      },
      {
        id: 'q2m2',
        name: 'Month 5 — Revenue',
        tasks: [
          { id: 'q2m2t1', title: 'Launch paid tier', description: 'Ship your first paid subscription plan.' },
          { id: 'q2m2t2', title: 'Achieve $1K MRR', description: 'Hit $1,000 in monthly recurring revenue.' },
          { id: 'q2m2t3', title: 'Implement churn tracking', description: 'Set up systems to track and reduce churn.' },
          { id: 'q2m2t4', title: 'Build sales playbook', description: 'Document your repeatable sales process.' },
          { id: 'q2m2t5', title: 'Get 3 case studies', description: 'Document success stories from early customers.' },
        ],
      },
      {
        id: 'q2m3',
        name: 'Month 6 — Scale Prep',
        tasks: [
          { id: 'q2m3t1', title: 'Prepare investor deck', description: 'Build a compelling 10-slide pitch deck.' },
          { id: 'q2m3t2', title: 'Financial model 18 months', description: 'Create detailed financial projections.' },
          { id: 'q2m3t3', title: 'Hire first key employee', description: 'Identify and recruit your first critical hire.' },
          { id: 'q2m3t4', title: 'Achieve $5K MRR', description: 'Scale revenue to $5,000 monthly.' },
          { id: 'q2m3t5', title: 'Begin investor outreach', description: 'Start conversations with 20 target investors.' },
        ],
      },
    ],
  },
  {
    id: 'q3',
    name: 'Q3 — Scale',
    months: [
      {
        id: 'q3m1',
        name: 'Month 7 — Investment',
        tasks: [
          { id: 'q3m1t1', title: 'Close seed round', description: 'Secure your first institutional investment.' },
          { id: 'q3m1t2', title: 'Set up legal structure', description: 'Formalize company structure for investment.' },
          { id: 'q3m1t3', title: 'Build advisory board', description: 'Recruit 3-5 strategic advisors.' },
          { id: 'q3m1t4', title: 'Expand to new market', description: 'Test product in a second geography or vertical.' },
          { id: 'q3m1t5', title: 'Achieve $10K MRR', description: 'Hit $10,000 monthly recurring revenue.' },
        ],
      },
      {
        id: 'q3m2',
        name: 'Month 8 — Team',
        tasks: [
          { id: 'q3m2t1', title: 'Hire 3 key team members', description: 'Scale the core team with critical roles.' },
          { id: 'q3m2t2', title: 'Set up OKR system', description: 'Implement company-wide goal tracking.' },
          { id: 'q3m2t3', title: 'Build engineering roadmap', description: 'Plan product development for next 6 months.' },
          { id: 'q3m2t4', title: 'Launch partner program', description: 'Create a formal partner/reseller channel.' },
          { id: 'q3m2t5', title: 'Establish company culture doc', description: 'Write values, norms, and working principles.' },
        ],
      },
      {
        id: 'q3m3',
        name: 'Month 9 — Operations',
        tasks: [
          { id: 'q3m3t1', title: 'Automate key workflows', description: 'Reduce manual work by 50% through automation.' },
          { id: 'q3m3t2', title: 'Implement customer success process', description: 'Build proactive customer success playbook.' },
          { id: 'q3m3t3', title: 'Launch enterprise tier', description: 'Create an enterprise pricing and feature set.' },
          { id: 'q3m3t4', title: 'Achieve $25K MRR', description: 'Hit $25,000 monthly recurring revenue.' },
          { id: 'q3m3t5', title: 'Get featured in major press', description: 'Land a story in TechCrunch or similar.' },
        ],
      },
    ],
  },
  {
    id: 'q4',
    name: 'Q4 — Dominate',
    months: [
      {
        id: 'q4m1',
        name: 'Month 10 — Market Leadership',
        tasks: [
          { id: 'q4m1t1', title: 'Launch v2.0 product', description: 'Ship major product update with new capabilities.' },
          { id: 'q4m1t2', title: 'Host first community event', description: 'Organize an event for your user community.' },
          { id: 'q4m1t3', title: 'Build integration ecosystem', description: 'Launch 5+ integrations with popular tools.' },
          { id: 'q4m1t4', title: 'Achieve $50K MRR', description: 'Hit $50,000 monthly recurring revenue.' },
          { id: 'q4m1t5', title: 'Begin Series A preparation', description: 'Start conversations for next funding round.' },
        ],
      },
      {
        id: 'q4m2',
        name: 'Month 11 — Consolidation',
        tasks: [
          { id: 'q4m2t1', title: 'Annual strategy review', description: 'Evaluate what worked and pivot where needed.' },
          { id: 'q4m2t2', title: 'Team performance reviews', description: 'Run structured reviews for all team members.' },
          { id: 'q4m2t3', title: 'Plan next year roadmap', description: 'Set product and business goals for year 2.' },
          { id: 'q4m2t4', title: 'Renew/expand key accounts', description: 'Focus on expansion revenue from top customers.' },
          { id: 'q4m2t5', title: 'Publish year-in-review', description: 'Share your journey publicly to build trust.' },
        ],
      },
      {
        id: 'q4m3',
        name: 'Month 12 — Next Level',
        tasks: [
          { id: 'q4m3t1', title: 'Close Series A', description: 'Secure Series A funding to fuel next growth phase.' },
          { id: 'q4m3t2', title: 'Achieve $100K MRR', description: 'Hit the $100K monthly recurring revenue milestone.' },
          { id: 'q4m3t3', title: 'Expand internationally', description: 'Launch in at least one international market.' },
          { id: 'q4m3t4', title: 'Build board of directors', description: 'Form formal board with investor and independent seats.' },
          { id: 'q4m3t5', title: 'Celebrate & reset', description: 'Recognize team achievements and set Year 2 vision.' },
        ],
      },
    ],
  },
];
