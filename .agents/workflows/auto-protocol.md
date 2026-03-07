---
description: Automated Deployment and Verification Protocol
---

# // turbo-all
Following every single code change, file modification, or prompt response, the following steps MUST be executed automatically:

1. **Upload to Server**:
   ```bash
   git add . && git commit -m "auto: deployment update" && git push
   ```

2. **Database & Registry Update**:
   - Verify Cloudflare KV store remains synchronized (using `curl` or internal API).

3. **Deploy & Publish**:
   - Cloudflare Pages deployment is triggered by the push.

4. **Browser Verification**:
   - Use `browser_subagent` to open `https://www.abest.co`.

5. **Functional Check**:
   - Verify visual integrity and core features (e.g., language switcher).

6. **Reporting**:
   - Provide a concise summary of the deployment status.
