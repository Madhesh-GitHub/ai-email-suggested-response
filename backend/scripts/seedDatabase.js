/**
 * Seed script: inserts synthetic customer support email pairs into MongoDB
 * and generates Gemini embeddings for each.
 *
 * Run: node scripts/seedDatabase.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { GoogleGenAI } from '@google/genai';
import EmailPair from '../models/EmailPair.js';

const ai = new GoogleGenAI({ apiKey: process.env.Gemini });

async function generateEmbedding(text) {
  const result = await ai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: text,
  });
  return result.embeddings[0].values;
}

const dataset = [
  // BILLING
  {
    category: 'billing',
    customerEmail: `Hi, I was charged twice for my subscription this month. My account shows two transactions of $29.99 on March 5th and March 6th. This is frustrating. Please fix this immediately.`,
    referenceReply: `Dear Customer,\n\nThank you for bringing this to our attention. I sincerely apologize for the double charge — this is certainly not the experience we want for you.\n\nI have looked into your account and can confirm the duplicate transaction. We will issue a full refund of $29.99 for the duplicate charge within 5–7 business days.\n\nYou will receive a refund confirmation email shortly. If you have any further questions, please don't hesitate to reach out.\n\nBest regards,\nSupport Team`,
  },
  {
    category: 'billing',
    customerEmail: `I cancelled my subscription last month but I'm still being charged. I have the cancellation confirmation email. This needs to stop immediately.`,
    referenceReply: `Dear Customer,\n\nI apologize for the inconvenience this has caused. This should not have happened after your cancellation.\n\nI have located your cancellation confirmation and will immediately stop any further charges. The charge that occurred after your cancellation will be refunded within 3–5 business days.\n\nThank you for your patience, and I'm sorry again for the oversight.\n\nWarm regards,\nBilling Team`,
  },
  {
    category: 'billing',
    customerEmail: `My invoice shows a charge of $150 but I was on the $99 plan. Can you explain why there is an extra $51 charge?`,
    referenceReply: `Dear Customer,\n\nThank you for reaching out. The additional $51 on your invoice relates to a pro-rated charge for upgrading your plan mid-billing cycle on February 18th.\n\nIf this upgrade was unintended, please let me know and I will reverse the charge and revert your account to the $99 plan.\n\nWe value your business and want to make sure billing is completely transparent for you.\n\nBest regards,\nBilling Support`,
  },
  // REFUND
  {
    category: 'refund',
    customerEmail: `I purchased a product 3 days ago but it is defective. The screen doesn't turn on. I want a full refund, not an exchange. Order #ORD-44821.`,
    referenceReply: `Dear Customer,\n\nI'm very sorry to hear that your product arrived defective. A non-functioning screen is absolutely unacceptable.\n\nWe have initiated a full refund for Order #ORD-44821. You will see the amount credited back to your original payment method within 5–7 business days. You do not need to return the defective item.\n\nAgain, I apologize for this experience. Please let us know if there's anything else we can help with.\n\nSincerely,\nCustomer Care Team`,
  },
  {
    category: 'refund',
    customerEmail: `I returned my order two weeks ago but still haven't received my refund. The tracking shows the package was delivered to your warehouse on the 1st.`,
    referenceReply: `Dear Customer,\n\nThank you for following up. I can see from our receiving records that your return was indeed delivered on the 1st.\n\nI apologize for the delay — refunds typically process within 10 business days of receiving the return. I have escalated this to our finance team and your refund will be processed within the next 48 hours.\n\nYou will receive a confirmation email once it is done. Thank you for your patience.\n\nBest,\nReturns Team`,
  },
  {
    category: 'refund',
    customerEmail: `I bought a concert ticket through your platform but the event was cancelled. I want my money back. It's been 10 days and no refund.`,
    referenceReply: `Dear Customer,\n\nI completely understand your frustration — waiting for a refund on a cancelled event is stressful.\n\nI have confirmed that the event was cancelled and have manually triggered your refund. You should see $85 returned to your account within 3–5 business days.\n\nThank you for your patience and I'm sorry for the delay in processing this for you.\n\nWarm regards,\nTicketing Support`,
  },
  // ACCOUNT
  {
    category: 'account',
    customerEmail: `I can't log into my account. I've reset my password three times but keep getting "Invalid credentials." I need access urgently for a work project.`,
    referenceReply: `Dear Customer,\n\nI understand how urgent this is, and I apologize for the login issues you're experiencing.\n\nI've reviewed your account and noticed it may be locked due to multiple failed attempts. I have manually unlocked it. Please try logging in again now with your most recently set password.\n\nIf you continue to have trouble, reply to this email and I'll set up a secure temporary access link for you.\n\nBest regards,\nAccount Support`,
  },
  {
    category: 'account',
    customerEmail: `Someone has been accessing my account without my permission. I see logins from a different country. Please help me secure my account immediately.`,
    referenceReply: `Dear Customer,\n\nThis is serious and we take account security very seriously. I have immediately locked your account to prevent any further unauthorized access.\n\nPlease follow these steps:\n1. Click the password reset link we just sent to your registered email.\n2. Enable two-factor authentication after logging in.\n3. Review your account activity and contact us if any changes were made without your consent.\n\nOur security team will investigate the unauthorized logins. You are safe now.\n\nUrgently,\nSecurity Team`,
  },
  {
    category: 'account',
    customerEmail: `I want to delete my account and all my personal data in accordance with GDPR. Please confirm this will be done and in what timeframe.`,
    referenceReply: `Dear Customer,\n\nThank you for your request. We fully respect your right to erasure under GDPR.\n\nWe will permanently delete your account and all associated personal data within 30 days, as required by law. You will receive a confirmation email once the deletion is complete.\n\nPlease note that some anonymized data may be retained for legal compliance purposes, but it will not be linked to you personally.\n\nBest regards,\nPrivacy Team`,
  },
  // SUBSCRIPTION
  {
    category: 'subscription',
    customerEmail: `I want to upgrade from Basic to Pro plan. What are the differences between the plans and will I be charged immediately?`,
    referenceReply: `Dear Customer,\n\nGreat to hear you're interested in upgrading! Here are the key differences:\n\n• Basic ($9.99/mo): 5 projects, 10GB storage, email support\n• Pro ($24.99/mo): Unlimited projects, 100GB storage, priority support + advanced analytics\n\nIf you upgrade today, you'll be charged a pro-rated amount for the current billing cycle, then the full Pro price from your next renewal date.\n\nTo upgrade, simply go to Settings > Subscription. Let me know if you have any questions!\n\nBest,\nSupport Team`,
  },
  {
    category: 'subscription',
    customerEmail: `I want to cancel my subscription. I'm no longer using the service and can't afford it right now.`,
    referenceReply: `Dear Customer,\n\nWe're sorry to hear you're leaving, but we completely understand.\n\nTo cancel your subscription, go to Settings > Billing > Cancel Subscription. Your access will continue until the end of your current billing period.\n\nIf budget is the main concern, we also offer a Pause plan at $0/month that keeps your data safe for up to 6 months. Would that be helpful?\n\nEither way, we wish you all the best. Feel free to come back anytime.\n\nSincerely,\nSupport Team`,
  },
  {
    category: 'subscription',
    customerEmail: `I signed up for the free trial 3 weeks ago but I'm being charged $39. I thought the trial was 30 days?`,
    referenceReply: `Dear Customer,\n\nThank you for reaching out. I apologize for the confusion.\n\nAfter reviewing our records, your trial was started on a promotional offer that was 21 days. The pricing page has since been updated to reflect 30 days, which I understand is confusing.\n\nAs a goodwill gesture, I have issued a full refund of $39 and extended your trial for an additional 9 days so you get the full 30-day experience.\n\nSorry for any confusion caused.\n\nBest regards,\nBilling Team`,
  },
  // DELIVERY
  {
    category: 'delivery',
    customerEmail: `My order was supposed to arrive 5 days ago but tracking shows it's been sitting in the distribution center since Tuesday. What's going on?`,
    referenceReply: `Dear Customer,\n\nI apologize for the delay with your order. After reviewing your tracking, it appears your package has been held at the distribution center due to a regional sorting facility issue.\n\nI have escalated this to our logistics partner and requested priority dispatch. Your package should be on route within 24 hours with a delivery update to follow.\n\nIf it does not arrive by Friday, please contact us again and we will issue a replacement shipment.\n\nThank you for your patience.\n\nBest,\nDelivery Support`,
  },
  {
    category: 'delivery',
    customerEmail: `The courier marked my package as delivered but I never received it. My neighbor didn't receive it either. Order #7734.`,
    referenceReply: `Dear Customer,\n\nI'm so sorry to hear your package wasn't received despite being marked as delivered.\n\nI have filed a lost package investigation with the courier for Order #7734. This typically takes 2–3 business days.\n\nIn the meantime, I am arranging a replacement shipment for you at no cost. You will receive a new tracking number within 24 hours.\n\nWe sincerely apologize for this experience.\n\nWarm regards,\nOrder Support`,
  },
  {
    category: 'delivery',
    customerEmail: `My package arrived damaged. The box was crushed and the item inside is broken. I have photos. What should I do?`,
    referenceReply: `Dear Customer,\n\nI'm very sorry your order arrived damaged — that is completely unacceptable.\n\nPlease reply to this email with the photos you mentioned so we can file a damage claim with the courier. Once received, we will immediately ship a replacement at no charge.\n\nYou do not need to return the damaged item. Keep or dispose of it as you wish.\n\nThank you for the photos and I'm sorry this happened.\n\nSincerely,\nClaims Team`,
  },
  // COMPLAINT
  {
    category: 'complaint',
    customerEmail: `I've contacted support 4 times about the same issue and it's still not resolved. I'm extremely frustrated and considering leaving your service.`,
    referenceReply: `Dear Customer,\n\nI sincerely apologize for the repeated failures to resolve your issue. This is not the service standard we hold ourselves to, and I completely understand your frustration.\n\nI am personally taking ownership of your case. I have reviewed all four previous interactions and [specific action being taken].\n\nI will follow up with you personally by end of day today with a resolution, not just an update.\n\nThank you for your patience and for giving us one more opportunity to make this right.\n\nApologetically,\nSenior Support Manager`,
  },
  {
    category: 'complaint',
    customerEmail: `Your app has been crashing constantly for the past week on iOS. It's completely unusable. I pay for a premium plan and this is unacceptable.`,
    referenceReply: `Dear Customer,\n\nI completely understand your frustration, and I sincerely apologize for the poor experience. A premium plan should always deliver a reliable, seamless experience.\n\nOur engineering team is actively working on an iOS stability fix that will be released in the next 48 hours. As compensation for the disruption, I have added one free month to your account.\n\nIn the meantime, you can access all features via our web app at app.example.com. Thank you for your patience.\n\nBest regards,\nProduct Support`,
  },
  // PRODUCT QUESTIONS
  {
    category: 'product',
    customerEmail: `Does your project management tool integrate with Slack and Google Calendar? I need to know before I purchase.`,
    referenceReply: `Dear Customer,\n\nYes! Our tool integrates natively with both Slack and Google Calendar.\n\n• Slack: Receive task updates, reminders, and @mentions directly in your Slack channels. You can also create tasks from Slack messages.\n• Google Calendar: All task due dates and milestones sync automatically to your Google Calendar in real time.\n\nBoth integrations are available on all paid plans. You can set them up from Settings > Integrations after signing up.\n\nHope this helps! Let us know if you have more questions.\n\nBest,\nSales Support`,
  },
  {
    category: 'product',
    customerEmail: `What is your data backup policy? How often is my data backed up and can I export it?`,
    referenceReply: `Dear Customer,\n\nGreat question! Data security is a top priority for us.\n\nYour data is:\n• Backed up every 6 hours to geographically distributed servers\n• Retained for 30 days (Pro plan) or 90 days (Enterprise plan)\n• Exportable at any time in CSV, JSON, or PDF format via Settings > Export Data\n\nFor Enterprise customers, we also support SFTP exports and custom backup schedules.\n\nLet me know if you need any clarification!\n\nBest regards,\nTechnical Support`,
  },
  // TECHNICAL
  {
    category: 'technical',
    customerEmail: `I'm getting a 500 Internal Server Error when I try to export my reports. I've tried different browsers but the problem persists.`,
    referenceReply: `Dear Customer,\n\nThank you for the detailed report. A 500 error during export is a server-side issue, and I'm sorry it's been affecting you regardless of browser.\n\nOur technical team has been notified and is investigating the report export service. The issue appears to affect reports over 10,000 rows due to a timeout.\n\nAs a temporary workaround: try exporting with a shorter date range or filtering your data first to reduce the row count.\n\nWe expect to have a fix deployed within 24 hours. I'll follow up once it's resolved.\n\nBest,\nTech Support`,
  },
  {
    category: 'technical',
    customerEmail: `The API is returning 401 errors despite using the correct API key. I've regenerated it twice. Nothing works.`,
    referenceReply: `Dear Customer,\n\nI'm sorry you're experiencing 401 errors — this is particularly frustrating when you've already tried regenerating the API key.\n\nA few things to verify:\n1. Ensure the API key is passed in the Authorization header as: Bearer <your_key>\n2. Check that your account's API access is enabled (Settings > API > Enable API Access)\n3. Confirm the key wasn't generated under a different workspace\n\nI have also checked your account and see API access is enabled. Please try again and if it still fails, share a sanitized version of your request headers so I can investigate further.\n\nBest,\nDeveloper Support`,
  },
  // GENERAL
  {
    category: 'general',
    customerEmail: `Hi, I'm new to your platform. How do I get started? Is there a tutorial or onboarding guide?`,
    referenceReply: `Dear Customer,\n\nWelcome aboard! We're delighted to have you.\n\nHere's how to get started quickly:\n1. Complete your profile setup (click your avatar > Profile)\n2. Create your first project from the Dashboard\n3. Invite your team members (Project > Members > Invite)\n\nWe also have:\n• A Getting Started video guide in our Help Center\n• An interactive onboarding checklist in your Dashboard\n• Live onboarding webinars every Tuesday at 10am EST\n\nFor any questions, our support team is available 24/7. Don't hesitate to ask!\n\nWelcome again,\nCustomer Success Team`,
  },
  {
    category: 'general',
    customerEmail: `What are your customer support hours and what's the best way to reach you for urgent issues?`,
    referenceReply: `Dear Customer,\n\nGreat question! Here are our support channels:\n\n• Live Chat: Available 24/7 for all paid plans — fastest for urgent issues\n• Email Support: Mon–Fri 9am–6pm EST (replies within 4 hours)\n• Phone Support: Available for Enterprise plans only\n• Help Center: docs.example.com — available 24/7\n\nFor urgent issues on any paid plan, Live Chat in the bottom-right corner of the app is the fastest way to reach us.\n\nHope that helps!\n\nBest,\nSupport Team`,
  },
];

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MongoDB);
  console.log('✅ Connected');

  // Clear existing data
  await EmailPair.deleteMany({});
  console.log('🗑️  Cleared existing email pairs');

  let success = 0;
  let failed = 0;

  for (let i = 0; i < dataset.length; i++) {
    const item = dataset[i];
    try {
      const embeddingInput = `${item.customerEmail} ${item.referenceReply}`;
      console.log(`[${i + 1}/${dataset.length}] Generating embedding for "${item.category}" pair...`);
      const embedding = await generateEmbedding(embeddingInput);

      await EmailPair.create({ ...item, embedding });
      console.log(`  ✅ Saved`);
      success++;

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 500));
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Seeding complete: ${success} succeeded, ${failed} failed`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
