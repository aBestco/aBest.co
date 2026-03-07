const https = require('https');

async function testLiveSite() {
    console.log("1. Testing website availability (https://abest.co/de/partnerschaften.html)...");
    
    try {
        const pageLoad = await fetch('https://abest.co/de/partnerschaften.html');
        if (pageLoad.ok) {
            console.log("✅ Page loaded successfully (Status: " + pageLoad.status + ")");
        } else {
            console.error("❌ Page load failed: " + pageLoad.status);
        }

        console.log("\n2. Submitting test inquiry to live API...");
        const formData = new FormData();
        formData.append('type', 'Idee');
        formData.append('name', 'Automated Integration Test');
        formData.append('email', 'test@example.com');
        formData.append('location', 'Test City');
        formData.append('message', 'This is an automated test to verify the Cloudflare KV connection.');
        
        const postRes = await fetch('https://abest.co/api/inquiries', {
            method: 'POST',
            body: formData
        });
        
        if (postRes.ok) {
            const data = await postRes.json();
            console.log("✅ Inquiry submitted successfully! UUID: " + data.id);
            
            console.log("\n3. Verifying Admin API access (GET /api/inquiries) with Basic Auth...");
            const authHeader = 'Basic ' + Buffer.from('admin:abest2026').toString('base64');
            const getRes = await fetch('https://abest.co/api/inquiries', {
                method: 'GET',
                headers: { 'Authorization': authHeader }
            });
            
            if (getRes.ok) {
                const list = await getRes.json();
                console.log("✅ Admin API accessed successfully. Total inquiries: " + list.length);
                
                const found = list.find(item => item.id === data.id);
                if (found) {
                    console.log("✅ Test inquiry found in the database. End-to-end test passed!");
                    
                    // Cleanup: Let's change the status to "Erledigt"
                    console.log("\n4. Testing PUT API to update status...");
                    const putRes = await fetch(`https://abest.co/api/inquiries/${data.id}`, {
                        method: 'PUT',
                        headers: { 
                            'Authorization': authHeader,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: 'Erledigt', notes: 'Automated test cleanup.' })
                    });
                    
                    if (putRes.ok) {
                        console.log("✅ Inquiry status updated successfully.");
                    } else {
                        console.error("❌ Failed to update inquiry status: " + putRes.status);
                    }
                } else {
                    console.error("❌ Test inquiry was NOT found in the database!");
                }
                
            } else {
                console.error("❌ Admin API failed: " + getRes.status + " " + await getRes.text());
            }
            
        } else {
            console.error("❌ Submission failed: " + postRes.status + " " + await postRes.text());
        }
        
    } catch (e) {
        console.error("Error during test:", e);
    }
}

testLiveSite();
