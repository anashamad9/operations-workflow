export type CanvasNode = {
  id: string;
  title: string;
  description: string;
  parentId: string | null;
  x: number;
  y: number;
};

type Workflow = {
  id: string;
  title: string;
  summary: string;
  steps: { title: string; description: string }[];
};

const workflows: Workflow[] = [
  {
    id: "daily-updates",
    title: "Daily Reporting Updates",
    summary: "Collect client performance data, map it to the standard format, check it, and publish matching figures in both reporting systems.",
    steps: [
      { title: "Locate the Client Report", description: "Open the client reporting source listed in the Accesses sheet or Digizag system. Confirm that you are using the correct client, offer, and reporting period before extracting data." },
      { title: "Download Complete Source Data", description: "Export the report for the correct dates. It must include coupon codes or links and the commission or sale amount needed to calculate Digizag performance. Resolve missing fields with the source owner before proceeding." },
      { title: "Create the Update Template", description: "Prepare the standard working table with offer ID, partner ID, date, status, payout, revenue, sale amount, GEO, and code. Keep the original export available so each transformed row can be traced back to its source." },
      { title: "Map Codes and Check Values", description: "Fill the template and check currencies, dates, statuses, and unusual amounts. Download the current Offers Coupon sheet on the day of the update and use it to connect each code to its partner." },
      { title: "Apply Partner Payout Rules", description: "Assign partner IDs and payout rates from the Offers Coupon sheet. Confirm whether each payout is a percentage of revenue, a percentage of sale amount, or a fixed amount before calculating it." },
      { title: "Optional: Generate the Template", description: "For an automated route, upload the unchanged client export and current Offers Coupon sheet to the operations repository script. Review the generated template with the same checks used for a manual build." },
      { title: "Run Pre-Upload Quality Checks", description: "Find unassigned partner IDs, payout greater than revenue, revenue greater than sale amount, and other unexpected patterns. Investigate exceptions and correct the source mapping or calculation before publishing." },
      { title: "Upload to Both Systems", description: "Paste the approved data into the Google Sheet. In the new system, open My Data → Data Playground and upload using its own downloadable example template; map columns to that format before submission." },
      { title: "Reconcile Published Figures", description: "Refresh both systems after the upload. Compare totals, dates, and partner figures against the approved template and correct any missing or mismatched records." },
    ],
  },
  {
    id: "validation",
    title: "Monthly Validation",
    summary: "Verify client-approved results against pending data, publish validated figures, and send Finance a documented handoff.",
    steps: [
      { title: "Receive the Validation", description: "Get the validation from the client reporting system or an offline file shared by the account manager or email. Identify the offer and month, and retain the original report." },
      { title: "Check Required Fields", description: "Confirm that the validation includes dates and coupon codes, plus either commission or sale amounts. Clarify incomplete or ambiguous results before calculating final figures." },
      { title: "Compare Overall Cancellations", description: "Compare the validated total with the pending total for the same month. Calculate the overall cancellation rate and investigate a material or unexplained difference." },
      { title: "Build the Validation Template", description: "Use the same standard fields as daily updates. To map historical partner IDs and payout rates, create a separate copy of the Offers Coupon sheet as it stood on the final day of the validated month; do not overwrite the current sheet." },
      { title: "Review Partner and Code Patterns", description: "Compare validated and pending numbers for every partner and coupon code in the same month. Check cancellation rates individually and investigate unusual spikes, missing codes, or mismatched payouts." },
      { title: "Publish and Verify Validation", description: "Upload the approved validation to HasOffers and the new system. Refresh both and confirm the published totals and partner-level values match the checked template." },
      { title: "Send Finance the Final Report", description: "Export the validated report from HasOffers and email Finance the report and revenue amount. Copy the Finance and Operations teams; include the offer name, month, and validation report in the subject." },
    ],
  },
  {
    id: "campaign-setup",
    title: "New Campaign Setup",
    summary: "Check the CRM handoff, prove tracking works, configure the offer, and coordinate the team announcement.",
    steps: [
      { title: "Review the CRM Handoff", description: "When Growth marks a lead ready, check that the CRM includes coupon codes or links, contract, GEOs, website, point of contact, campaign type and name, discount logic, and reporting method. Request missing details before setup." },
      { title: "Test the Customer Offer", description: "Open the client website and test the coupon or link against the agreed discount logic. Place a test order when possible, using cash on delivery if available to avoid a paid test purchase." },
      { title: "Confirm GEO and Eligible Items", description: "Run the test in an included location and choose an eligible item. Some client products are excluded, so a failed test on the wrong item or GEO does not prove that the offer is broken." },
      { title: "Verify Conversion Tracking", description: "Check the agreed reporting channel for the test conversion. If it does not appear, return the issue to Growth and retest; once it appears, create the campaign in the new system and HasOffers with the contract, contact, and other required fields." },
      { title: "Complete Records and Assignment", description: "Finish the Offers Coupon sheet and Google Sheet offer details. Export the new system offer brief to Yazan Yousef so he can assign the responsible team and member." },
      { title: "Announce the Live Offer", description: "Work with the assigned team member on the announcement. Inform Digizag internally in Pumble's client news update channel first, then announce the offer in the new system and WhatsApp community." },
    ],
  },
  {
    id: "communications",
    title: "Team Communication & Escalation",
    summary: "Resolve operational issues through the right owners and keep a clear written record of decisions and handoffs.",
    steps: [
      { title: "Follow the Escalation Path", description: "Investigate the issue yourself, then ask Operations if it remains unresolved. For account-manager matters, raise a case with that manager; escalate unresolved cases to Yazan Yousef." },
      { title: "Write Actionable Cases", description: "Describe what happened, the steps already taken, the evidence, the impact, and the available options or decision needed. Make the next action and owner explicit." },
      { title: "Document Every Handoff", description: "Record information and decisions in Pumble or email, even for small cases. Keep the relevant people able to trace what was shared and agreed." },
      { title: "Escalate Reporting Issues", description: "If an issue concerns your reporting line, work with the next level in the company structure until there is a clear resolution or owner." },
      { title: "Keep Leaders in the Email Loop", description: "Copy your reporting point and the Head of Department on relevant operational emails so the escalation and decision trail stays visible." },
    ],
  },
  {
    id: "payments",
    title: "Payments & Invoices",
    summary: "Start payment work after monthly validation, prepare accurate partner and influencer invoices, obtain approvals, and hand the result to Finance.",
    steps: [
      { title: "Close the Validated Month", description: "Begin the payment cycle only after all offers for the month are validated and closed. Track the maximum 90-day payment window and schedule work early enough to meet it." },
      { title: "Set the Payment Deadline", description: "Validate offers as soon as client results arrive. The source gives an example of starting by early October to close a June cycle; use the applicable month and agreed deadline for each run." },
      { title: "Collect Partner Balances", description: "Open the payment sheet and HasOffers. Pull partner IDs and amounts for the target month, excluding influencers from this partner batch." },
      { title: "Prepare Partner Invoice Rows", description: "Add the partner amounts to the payment sheet. Check the relevant comparison or previous-period entries and update descriptions consistently with prior invoices, while using the correct target month." },
      { title: "Collect Influencer Balances", description: "Return to HasOffers for influencer data from the preceding month. Keep influencer entries separate from the partner batch and check their period and amounts." },
      { title: "Review and Request Approval", description: "Check all invoice details and send partner IDs to account managers for bank-detail approval. Send prepared invoice batches to Yazan Yousef for approval as they become ready." },
      { title: "Create Approved Invoices", description: "After approvals, create the invoices in HasOffers. Reconcile every invoice amount and identifier against the approved payment sheet." },
      { title: "Hand Off to Finance", description: "Email the completed invoice set to Finance and copy the Finance and Operations teams and the relevant account manager. Include the payment period and approved supporting details." },
    ],
  },
  {
    id: "apis",
    title: "API & Data Delivery",
    summary: "Define partner data needs, build the transfer, and provide a clear implementation document.",
    steps: [
      { title: "Define the Data Goal", description: "Confirm exactly what the client or partner needs: fields, scope, reporting period, delivery frequency, and how they will use the data." },
      { title: "Gather Access and Documentation", description: "Request the partner's tools, system details, API documentation, and any access or format requirements needed for the integration." },
      { title: "Prepare and Transform Data", description: "Clean the source data and build the Python script that extracts, maps, and formats it for the agreed endpoint. Check sample records before delivery." },
      { title: "Publish the JSON Feed", description: "Provide the agreed JSON data through a link or endpoint. Verify that the payload contains the expected fields and can be read by the partner." },
      { title: "Document the API", description: "Prepare a PDF guide for the partner or client with the endpoint, data fields, format, access method, refresh behavior, and an example response." },
    ],
  },
  {
    id: "database",
    title: "Database & Source Consistency",
    summary: "Keep shared offer records aligned across systems and resolve missing or ambiguous data before it spreads.",
    steps: [
      { title: "Sync Every Material Update", description: "When an account manager, client, or other owner changes an offer, update every relevant source, including Google Sheet offer details, the new system, and the Offers Coupon sheet where applicable." },
      { title: "Resolve Missing Fields", description: "Investigate blanks or unclear values instead of leaving them open. For example, ask why a partner ID is missing in the payment sheet, identify its owner, and update all affected records once resolved." },
    ],
  },
];

const NODE_WIDTH = 320;
const COLUMN_GAP = 100;
const STEP_GAP = 266;
const FIRST_X = 100;

export const operationsNodes: CanvasNode[] = [
  {
    id: "operations-root",
    title: "Operations Department",
    description: "End-to-end workflows for reporting, validation, campaign launches, communication, payments, API delivery, and source-data accuracy. Choose a branch below to follow its steps in order.",
    parentId: null,
    x: FIRST_X + ((workflows.length - 1) * (NODE_WIDTH + COLUMN_GAP)) / 2,
    y: 72,
  },
  ...workflows.flatMap((workflow, column) => {
    const x = FIRST_X + column * (NODE_WIDTH + COLUMN_GAP);
    const parentId = `operations-${workflow.id}`;
    return [
      { id: parentId, title: workflow.title, description: workflow.summary, parentId: "operations-root", x, y: 370 },
      ...workflow.steps.map((step, index) => ({
        id: `${parentId}-${index + 1}`,
        title: `${index + 1}. ${step.title}`,
        description: step.description,
        parentId: index === 0 ? parentId : `${parentId}-${index}`,
        x,
        y: 660 + index * STEP_GAP,
      })),
    ];
  }),
];

export const operationBranches = workflows.map(({ id, title }) => ({ id: `operations-${id}`, title }));
