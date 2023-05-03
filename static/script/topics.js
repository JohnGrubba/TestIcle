function update_topics() {
    fetch('/api/getTopics', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        return response.json()
    }).then(data => {
        let html_content = "";

        html_content += '<tr class="list-headers">'
        for (let key in data[0]) { // This assumes that at we want to have some description headers on top
            html_content += '<th class="list-head">' + key + '</th>' // Adds all attributes of the database as headers of the lists
        }
        html_content += '</tr>'
        for (let entry in data) {
            html_content += '<tr class="list-section">'
            for (let key in data[entry]) {
                switch (key) {
                    case "Modify":
                        html_content += '<td class="list-item">' + '<button class="modify-button" onclick="Modify(' + data[entry][key] + ')">' + '<span class="material-symbols-outlined">edit</span>' + '</button></td>' // Calls a function with the filepath
                        break
                    case "Delete":
                        html_content += '<td class="list-item">' + '<button class="download-button" onclick="Delete({ ID: ' + data[entry][key] + '}, `Topics`)">' + '<span class="material-symbols-outlined">delete</span>' + '</button></td>'
                        break
                    default:
                        html_content += '<td class="list-item"><a>' + data[entry][key] + '</a></td>'
                        break
                }

            }
            html_content += '</tr>'

        }
        document.getElementById("list").innerHTML = html_content
        // Update Placeholders
        if (data.length > 0)
            $("#list").next().hide()
        else
            $("#list").next().show()
        search()
    })
}

function AddTopic() {
    const input = document.getElementById("add_input")
    const subject_id = document.getElementById("subjects")
    if (!input.value) { return }
    let body = {
        name: input.value,
        subjectID: Number.parseInt(subject_id.value)
    }
    fetch("/api/createTopic", {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(response => {
        if (response.status == 204) {
            input.value = ""
            update_topics()
        }
    })
}

function Modify(id) {
    // Show Popup to modify
    const popup = document.getElementById("modify-popup")
    popup.toggleAttribute("hidden")
    popup.modify_id = id
}

function sendModifyRequest() {
    const input = document.getElementById("modify-input").value
    const popup = document.getElementById("modify-popup")
    let body = {
        tablename: "Topics",
        attribute: { topicName: input },
        condi: { ID: popup.modify_id }
    }
    console.log(body)

    fetch("/api/modify", {
        method: "PATCH",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(response => {
        if (response.status == 204)
            update_topics()
    })
    document.getElementById("modify-input").value = "";
    popup.toggleAttribute("hidden");
    search()
}

function refresh() {
    update_topics()
    loadSubjects()
}
refresh()