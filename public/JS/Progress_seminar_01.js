// document.addEventListener("DOMContentLoaded", function () {
//     console.log("Progress Seminar Table Loaded Successfully!");

//     // Example to dynamically calculate totals
//     const rows = document.querySelectorAll("tbody tr");
//     rows.forEach(row => {
//         const cells = row.querySelectorAll("td");
//         let total = 0;
//         for (let i = 6; i < cells.length - 1; i++) {
//             const value = parseInt(cells[i].innerText) || 0;
//             total += value;
//         }
//         if (cells.length > 0) {
//             row.lastElementChild.innerText = total;
//         }
//     });
// });


document.addEventListener("DOMContentLoaded", function () {
    console.log("Progress Seminar Table Loaded Successfully!");

    const rows = document.querySelectorAll("tbody tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");

        // Skip rows that are too short (not student rows)
        if (cells.length >= 7) {
            // Rubric cells are always the last 7 cells before total
            // So take the 6 cells before the last one
            // 
            // 
            // 
            // 
            // 
            // 
            // 
            // 
            // 
            // 
            // 
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            const rubricCells = Array.from(cells).slice(-7, -1);
            const totalCell = cells[cells.length - 1];

            function updateTotal() {
                let total = 0;
                rubricCells.forEach(cell => {
                    const value = parseInt(cell.innerText.trim()) || 0;
                    total += value;
                });
                totalCell.innerText = total;
            }

            // Calculate initial total
            updateTotal();

            // Add event listeners for dynamic total update
            rubricCells.forEach(cell => {
                cell.addEventListener("input", updateTotal);
            });
        }
    });
});
