import type { Persona } from "../types.js";

export const apiEngineer: Persona = {
  name: "api-engineer",
  description: "Backend engineer at a fintech startup. Manages infrastructure handling 500K+ API calls/day across payment processors, banking partners, and microservices. Evaluates API gateways, monitoring, and webhook platforms.",
  seedPrompts: [
    "I'm a backend engineer at a fintech startup. We process about 500K API calls per day across payment processors like Stripe, banking partners like Plaid, and a dozen internal microservices. Our stack is Node.js with PostgreSQL and Redis.",
    "Our current API gateway setup is becoming a bottleneck. We've outgrown our hand-rolled rate limiting and need proper request transformation and circuit breaking. I'm evaluating Kong vs Tyk vs AWS API Gateway for handling our traffic patterns and authentication needs.",
    "I also manage our webhook infrastructure. We're pushing over 2 million events per day to customer webhook endpoints and need reliable delivery with automatic retries, dead letter queues, and detailed delivery analytics. The current system drops about 0.5% of deliveries which is unacceptable.",
    "For monitoring we use Datadog but it's getting expensive at our scale — about $8K/month. I'm evaluating open source alternatives like Grafana, Prometheus, and SigNoz for API observability, distributed tracing, and real-time alerting. What would you recommend for a team of 12 engineers?",
  ],
};
