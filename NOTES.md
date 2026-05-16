# Render Customer-Experience Notes

A running journal of friction points, doc gaps, and "I bet a new customer would stumble here" observations from deploying The Dad Joke Machine to Render.

**Purpose:** raw material for interview conversations about user empathy, onboarding flows, and where engineering investment could improve the customer experience.

**Format:** date-stamped entries. Capture the moment, don't polish.

---

## How to use this doc during the deploy

As you walk through the deployment, note anything that:
- Made you pause or re-read
- Required Googling outside Render's docs
- Felt different than you expected
- Would confuse a first-time user who isn't a developer
- Worked surprisingly well (good things are notes too!)

Bias toward writing too much. You can trim later for the interview.

---

## Signup & account setup

<!-- Things to capture here:
- Did the signup flow feel professional / trustworthy?
- Was the email verification step smooth?
- Did the dashboard make sense on first login? What was the first thing you wanted to do, and did the UI guide you there?
- Free vs paid tier clarity — did you understand what "free" got you up front?
-->

- *(fill in during deploy)*

---

## GitHub integration

<!-- Things to capture:
- OAuth flow: smooth or scary? Did Render request permissions that made sense?
- Selecting the repo: easy to find? Could you preview the repo before connecting?
- Was it clear what Render would do with the repo (read code, write status checks, etc.)?
-->

- *(fill in during deploy)*

---

## Static Site deploy

<!-- Things to capture:
- How long from "Create Static Site" click to live URL?
- Did the build logs make sense in real time?
- If something failed, was the error message useful?
- Did the auto-generated .onrender.com URL appear where you expected?
- Caching headers: did your render.yaml settings take effect? How did you verify?
-->

- *(fill in during deploy)*

---

## Web Service deploy (backend API)

<!-- Things to capture:
- Selecting "Web Service" vs "Static Site" — was the distinction clear?
- Region/instance type choices — felt overwhelming or appropriate?
- Build command / start command auto-detection: right or wrong?
- Health check path config: did it work first try?
- Environment variables UI — easy to add/edit? Secrets handling clear?
- First cold start delay: how long was it? Did the dashboard explain why?
- Logs streaming: latency, search, filtering — how did it feel?
-->

- *(fill in during deploy)*

---

## Blueprint (render.yaml) deploy

<!-- Things to capture:
- Did Render auto-detect the render.yaml? Or did you have to point at it?
- Multi-service blueprint UI: clear which services were about to be created?
- If you had errors in the yaml, how good was the feedback?
- Did rootDir behave the way you expected?
-->

- *(fill in during deploy)*

---

## Custom domain + DNS

<!-- Things to capture:
- How clear were the DNS instructions?
- Did Render distinguish between apex (root) and www DNS records well?
- Verification step: how long did it take after adding records? Did the UI poll for you, or did you have to refresh?
- SSL cert provisioning: automatic? Visible progress?
- Common gotchas you hit (CNAME at apex isn't supported by many registrars, for example)
-->

- *(fill in during deploy)*

---

## CORS and the frontend/backend wiring

<!-- The static site at one .onrender.com URL, the API at another — they need CORS configured.
What I had to do: set ALLOWED_ORIGINS env var on the API to include the static site's URL.
Was the error message in the browser console useful? Was the connection between cause and fix obvious? -->

- *(fill in during deploy)*

---

## Free tier cold starts

<!-- This is the big one for customer empathy.
- How long was the cold start on the first request after idle?
- What did the user-facing experience feel like? (Page loads but joke fetch hangs)
- Could a non-technical user have any idea what was happening?
- Render's docs on the cold-start behavior — easy to find? Honest about the implications?
- What would I want to say to a prospect evaluating free vs starter ($7/mo)? -->

- *(fill in during deploy)*

---

## Surprises (positive)

- *(things that were better than expected)*

## Surprises (negative)

- *(things that were rougher than expected)*

## Things I'd ask the product team

- *(open questions, hypotheses, "why does it work this way?")*

## Things a non-technical user would stumble on

- *(empathy notes for the prospective-customer perspective)*

---

## Interview talking-point shortlist

After deploying, distill the above into 3-5 sharp observations to bring up in interviews. Format:

1. **Observation:** [one sentence]
   **Why it matters:** [one sentence about the customer or business impact]
   **What I'd explore:** [one sentence about how you'd investigate further]

Example:
1. **Observation:** The free-tier web service's 30-second cold start is felt by the *user* of the site, not just the operator.
   **Why it matters:** A prospect evaluating Render for production may form a quality impression based on a sleepy demo deploy.
   **What I'd explore:** How does Render communicate this tradeoff during onboarding? Is there a "wake on traffic" indicator users can show their stakeholders?
