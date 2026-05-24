const SHEET_URL = "https://docs.google.com/spreadsheets/d/1LTbB11q5DJhJQMNNGrr8o45coTZJU1U0c6d0gXx24_c/gviz/tq?tqx=out:json";

async function loadData() {
  const res = await fetch(SHEET_URL);
  const text = await res.text();
  const json = JSON.parse(text.substr(47).slice(0, -2));

  const rows = json.table.rows.slice(1).map(r => r.c.map(c => c ? c.v : ""));
  render(rows);
}

function render(rows) {
  const tbody = document.getElementById("table-body");
  tbody.innerHTML = "";

  rows.forEach(row => {
    const [english, japanese] = row;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${english}</td>
      <td>${japanese}</td>
    `;
    tbody.appendChild(tr);
  });
}

loadData();
