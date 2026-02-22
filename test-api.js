const fs = require('fs');
const path = require('path');

async function testApi() {
    try {
        const oppPath = path.join(__dirname, 'ExcelFiles', 'Opportunities 20260222.xlsx');
        const custPath = path.join(__dirname, 'ExcelFiles', 'Customers 20260222.xlsx');

        const oppBuffer = fs.readFileSync(oppPath);
        const custBuffer = fs.readFileSync(custPath);

        const oppBlob = new Blob([oppBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const custBlob = new Blob([custBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const formData = new FormData();
        formData.append("opportunities", oppBlob, "Opportunities 20260222.xlsx");
        formData.append("customers", custBlob, "Customers 20260222.xlsx");

        console.log("Sending POST to http://localhost:3000/api/upload ...");
        const start = Date.now();
        const res = await fetch("http://localhost:3000/api/upload", {
            method: "POST",
            body: formData
        });

        const data = await res.json();
        const end = Date.now();
        console.log(`Response received in ${end - start}ms: Status ${res.status}`);

        if (res.status !== 200) {
            console.error("API Error Response:", data);
            return;
        }

        console.log(`Success! Parsed ${data.data.opportunities.length} opportunities.`);
        console.log("Data Quality Report:");
        console.log(`- Open Pipeline: £${data.data.currentSnapshot.openPipelineValueGbp}`);
        console.log(`- Join Match Rate: ${data.data.report.joinMatchRate}%`);
        console.log(`- Total Accounts Unmatched: ${data.data.report.unmatchedAccounts.length}`);

    } catch (err) {
        console.error("Test Request Error:", err);
    }
}

testApi();
