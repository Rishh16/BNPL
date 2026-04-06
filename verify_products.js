const fetch = require('node-fetch');

async function countProducts() {
    try {
        const res = await fetch('http://localhost:5001/products');
        const products = await res.json();
        console.log(`Total Products: ${products.length}`);

        // Count by category
        const counts = {};
        products.forEach(p => {
            counts[p.category] = (counts[p.category] || 0) + 1;
        });
        console.log('Counts by Category:', counts);
    } catch (e) {
        console.error(e);
    }
}

countProducts();
