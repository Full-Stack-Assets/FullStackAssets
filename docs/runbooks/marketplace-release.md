# Marketplace release boundary

Public GitHub Pages deployment and marketplace API/database/artifact deployment are separate. This repository does not deploy the API, database, payment processor configuration, or artifact store. Production API deployment requires a separately approved provider adapter and credentials. Paid launch is blocked unless all ten release gates pass with evidence. Stripe events are evidence only; entitlement remains the access authority. Canon remains authoritative and cannot be mutated by commerce or Publisher Studio.
