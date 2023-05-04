function updateSliderValues() {
    const values = document.getElementsByClassName("slider_out")
    const inputs = document.getElementsByClassName("grade-val")
    for (let index = 0; index < values.length; index++) {
        const value = values[index];
        const input = inputs[index];
        value.textContent = input.value
        input.addEventListener("input", (event) => {
            value.textContent = event.target.value
        })
    }
}

function serialize() {
    const grd_entrys = document.getElementsByClassName("grading-entry")
    var data = {}
    for (let index = 0; index < grd_entrys.length; index++) {
        const element = grd_entrys[index];
        const percentage = Number.parseInt(element.getElementsByClassName("grade-val")[0].value)
        const grade = element.getElementsByClassName("grade-name")[0].value
        if (grade == "") continue;
        data[percentage] = grade
    }
    const grading_name = document.getElementById("gradingname").value
    if (grading_name == "") return false;
    data = { sheet_name: grading_name, grading: data }
    console.log(data);
    fetch("/api/createGrading", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then((response) => {
        if (response.status == 204)
            refresh()
    })
}

function updateGradingEntrys() {
    fetch('/api/getGrading', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        return response.json()
    }).then(data => {
        console.log(data);
    })
}

function addGradingEntry() {
    var html = `
        <label for="temp">Choose Min % for Grade</label><br />
        <input type="text" class="grade-name" placeholder="Grade..." required>
        <input type="range" style="width: 100%" list="markers" class="grade-val" min="0" max="100" required/>

        <datalist id="markers">
            <option value="0"></option>
            <option value="50"></option>
            <option value="60"></option>
            <option value="70"></option>
            <option value="80"></option>
            <option value="90"></option>
            <option value="100"></option>
        </datalist>
        <p>Min Percentage: <output class="slider_out"></output>%</p>
        <button onclick="$(this).parent('div').remove();">Remove</button>`
    const gradingentrys = document.getElementById("gradingentrys");
    var element = document.createElement("div");
    element.innerHTML = html;
    element.className = "grading-entry";
    gradingentrys.appendChild(element);
    updateSliderValues();
}

function refresh() {
    updateSliderValues();
    updateGradingEntrys();
}


refresh();