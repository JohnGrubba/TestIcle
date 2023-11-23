function updateSliderValues() {
    const values = document.getElementsByClassName("slider_out")
    const inputs = document.getElementsByClassName("grdval")
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
        const percentage = Number.parseInt(element.getElementsByClassName("grdval")[0].value)
        const grade = element.getElementsByClassName("grade-name")[0].value
        if (grade == "") continue;
        data[percentage] = grade
    }
    const grading_name = document.getElementById("gradingname").value
    if (grading_name == "" || Object.keys(data).length == 0) return false;
    data = { sheet_name: grading_name, grading: data }
    console.log(data);
    fetch("/api/createGrading", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then((response) => {
        if (response.status == 204) {
            refresh()
            document.getElementById("gradingname").value = ""
            document.getElementById("gradingentrys").innerHTML = `                <div class="grading-entry gradestyle">
                    <label for="temp">Choose Min % for Grade</label><br />
                    <input type="text" class="grade-name" placeholder="Grade..." required>
                    <input type="range" style="width: 100%" list="markers" class="grdval" required />

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
                </div>`
        }

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
        var html = ""
        data.forEach(grading_entry => {
            var grades = ""
            grading_entry.entries.forEach(entry => {
                grades += `
                <div class="gradestyle">
                    <p>Grade: <b>${entry.grade}</b></p>
                    <div class="gprt" prctg="${entry.percentage}"></div>

                    <datalist id="markers">
                        <option value="0"></option>
                        <option value="50"></option>
                        <option value="60"></option>
                        <option value="70"></option>
                        <option value="80"></option>
                        <option value="90"></option>
                        <option value="100"></option>
                    </datalist>
                    <p>Min Percentage: <output>${entry.percentage}</output>%</p>
                </div>
                `
            })

            html += `<tr>
                <button type="button" class="collapsible">${grading_entry.name}</button>
                <div class="content">
                    <b>Name: </b>
                    <p>${grading_entry.name}</p>
                    <b>Grades: </b>
                    <p>${grades}</p>

                    <div class="stretch">
                        <button style="width: 100%" class="download-button"
                            onclick="Delete({ ID: ${grading_entry.ID} }, 'GradingSheets')"><span
                                class="material-symbols-outlined">delete</span></button>
                        <button style="width: 100%" class="modify-button"
                            onclick="Modify(${grading_entry.ID}, 'GradingSheets')"><span
                                class="material-symbols-outlined">edit</span></button>
                    </div>
                </div>
            </tr>
            `
        });
        document.getElementById("list").innerHTML = html;
        addCollapsibleFunction();
        updateSliders();

        // Update Placeholders
        if (data.length > 0)
            $("#list").next().hide()
        else
            $("#list").next().show()
    })
}

function addGradingEntry() {
    var html = `
        <label for="temp">Choose Min % for Grade</label><br />
        <input type="text" class="grade-name" placeholder="Grade..." required>
        <input type="range" style="width: 100%" list="markers" class="grdval" min="0" max="100" required/>

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
    element.className = "grading-entry gradestyle";
    gradingentrys.appendChild(element);
    updateSliderValues();
}

function updateSliders() {
    var sliders = document.getElementsByClassName("gprt");
    for (let index = 0; index < sliders.length; index++) {
        let element = sliders[index];
        console.log(element);
        let value = Number.parseInt(element.attributes.getNamedItem("prctg").value);
        sliders[index].style.background = "linear-gradient(to right, green " + value + "%, white 0%)";
    };
}

function refresh() {
    updateSliderValues();
    updateGradingEntrys();
}


refresh();