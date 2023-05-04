function search(tables = ["list"]) {
    /* Must have structure
    *  <tr>
    *  <td></td>
    *  </tr>
    */
    tables.forEach(table_id => {
        var input, filter, table, tr, td, i, j, txtValue, rowMatches
        input = document.getElementById("search_input")
        filter = input.value.toUpperCase()
        table = document.getElementById(table_id)
        if (table === null) return;
        tr = table.getElementsByTagName("tr")

        // Loop through all table rows, and hide those which don't match the search query
        for (i = 1; i < tr.length; i++) {
            rowMatches = false
            for (j = 0; j < tr[i].getElementsByTagName("td").length; j++) {
                td = tr[i].getElementsByTagName("td")[j]
                if (td.children.item(0).nodeName == "A") {
                    txtValue = td.textContent || td.innerText // Tries to set txtValue ro textContent, if textContent (content and all that belongs to it) is undefinied innerText (Only visible text) is used
                    if (txtValue.toUpperCase().indexOf(filter) > -1) {
                        rowMatches = true
                    }
                }
            }
            if (rowMatches) { // If some entry is not found the style of it changes to none (Not displayed) else nothing changes -> ""
                tr[i].style.display = ""
            } else {
                tr[i].style.display = "none"
            }
        }
    });

}


function addCollapsibleFunction() {
    var coll = document.getElementsByClassName("collapsible");
    var i;
    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", function () {
            this.classList.toggle("active");
            var content = this.nextSibling;
            console.log(content);
            if (content.style.display === "block") {
                content.style.display = "none";
            } else {
                content.style.display = "block";
            }
        });
    }
}

function loadSubjects() {
    var subjects = "<option disabled selected value> -- select an option -- </option>";
    fetch('/api/getSubjects', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        return response.json()
    }).then(data => {
        console.log(data)
        data.forEach(subject => {
            subjects += `<option value="${subject.ID}">${subject.subjectName}</option>`
        });
        document.getElementById("subjects").innerHTML = subjects;
    });
}

function loadGradingSheet() {
    var gradingSheet = "<option disabled selected value> -- select an option -- </option>";
    fetch('/api/getGrading', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        return response.json()
    }).then(data => {
        console.log(data)
        data.forEach(gsh => {
            gradingSheet += `<option value="${gsh.ID}">${gsh.name}</option>`
        });
        document.getElementById("grdsht").innerHTML = gradingSheet;
    });
}

function loadTopics() {
    var topics = "<option disabled selected value> -- select an option -- </option>";
    fetch('/api/getTopics', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        return response.json()
    }).then(data => {
        console.log(data);
        var subject_groups = {};
        data.forEach(topic => {
            if (subject_groups[topic.subjectID])
                subject_groups[topic.subjectID].push(topic)
            else
                subject_groups[topic.subjectID] = [topic]
        });
        console.log(subject_groups)
        Object.keys(subject_groups).forEach(subject_id => {
            topics += `<optgroup label="${subject_groups[subject_id][0].subjectName}">`
            subject_groups[subject_id].forEach(topic => {
                topics += `<option value="${topic.ID}">${topic.topicName}</option>`
            })

        })

        document.getElementById("topics").innerHTML = topics;
    });
}

function Delete(condi, tablename) {
    console.log(condi)
    console.log(tablename)
    let body = {
        tablename: tablename,
        condi: condi
    }
    fetch("/api/delete", {
        method: "DELETE",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(response => {
        if (response.status == 204) {
            refresh();
        }
    })
}