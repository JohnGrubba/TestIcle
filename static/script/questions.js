// Frontend Scripting

function changeQuestionType() {
    const qtype = document.getElementById("questiontype").value
    switch (qtype) {
        case "txt":
            document.getElementById("txt").hidden = false;
            document.getElementById("mult").hidden = true;
            break;
        case "mult":
            document.getElementById("mult").hidden = false;
            document.getElementById("txt").hidden = true;
            break;
        default:
            break;
    }
}

function questionSearch() {
    var searchInput = document.getElementById("search_input").value.toUpperCase()
    var buttons = document.getElementsByClassName("collapsible")
    var divs = []

    for (const collapsible of buttons) {
        divs.push($(collapsible).next()[0])
    }

    for (let i = 0; i < divs.length; i++) {
        var matching = false;
        for (const element of $(divs[i]).children()) {
            if ($(element).prop('nodeName') == "P") {
                if (element.innerHTML.toUpperCase().includes(searchInput))
                    matching = true
            }
        }
        if (!buttons[i].innerHTML.toUpperCase().includes(searchInput) && !matching) {
            buttons[i].style.display = "none"
            divs[i].style.display = "none"
        }
        else {
            buttons[i].style.display = ""
            divs[i].style.display = ""
        }
    }
}

// Custom Functions for Questions (because more data and advanced search algorithm)
function update_questions() {
    fetch('/api/getQuestions', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        return response.json()
    }).then(data => {
        console.log(data);
        var content = "";
        data.mult.forEach(question => {
            var answers = "";
            question.answers.forEach(answer => {
                if (answer.correct)
                    checked = "checked"
                else
                    checked = ""
                answers += `<a><input disabled ${checked} type="checkbox"> ${answer.name}</a><br>`
            })
            content += `<tr>
                <button type="button" class="collapsible">${question.title}</button>
                <div class="content">
                    <b>Subject: </b><p>${question.subjectName}</p>
                    <b>Topic: </b><p>${question.topicName}</p>
                    <b>Question: </b><p>${question.question}</p>
                    <b>Points: </b><p>${question.points}</p>
                    <b>Choices: </b><p>${answers}</p>

                    <div class="stretch">
                        <button style="width: 100%" class="download-button" onclick="Delete({ questionID: ${question.questionID} }, 'MultipleChoice')"><span class="material-symbols-outlined">delete</span></button>
                        <button style="width: 100%" class="modify-button" onclick="Modify(${question.questionID}, 'MultipleChoice')"><span class="material-symbols-outlined">edit</span></button>
                    </div>
                </div>
                </tr>`
        });
        document.getElementById("multquestions").innerHTML = content;

        var content = "";
        data.text.forEach(question => {
            content += `<tr>
                            <button type="button" class="collapsible">${question.title}</button>
                            <div class="content">
                                <b>Subject: </b><p>${question.subjectName}</p>
                                <b>Topic: </b><p>${question.topicName}</p>
                                <b>Question: </b><p>${question.question}</p>
                                <b>Points: </b><p>${question.points}</p>
                                <b>Answer: </b><p>${question.exAns}</p>

                                <div class="stretch">
                                    <button style="width: 100%" class="download-button" onclick="Delete({ questionID: ${question.questionID} }, 'TextQuestions')"><span class="material-symbols-outlined">delete</span></button>
                                    <button style="width: 100%" class="modify-button" onclick="Modify(${question.questionID}, 'TextQuestions')"><span class="material-symbols-outlined">edit</span></button>
                                </div>
                            </div>
                        </tr>`
        });
        document.getElementById("txtquestions").innerHTML = content;

        // Set those funny event listeners for opening the collapsibles
        addCollapsibleFunction();

        // Update Placeholders
        if (data.text.length > 0)
            $("#txtquestions").next().hide()
        else
            $("#txtquestions").next().show()
        if (data.mult.length > 0)
            $("#multquestions").next().hide()
        else
            $("#multquestions").next().show()
    })

}

// Networking Stuff below

function addChoice() {
    const answers = document.getElementById("answers-mult")
    var answ = document.createElement('div');
    answ.className = "answer";
    answ.innerHTML = `<input type="checkbox"><input type="text" placeholder="Example Answer" required><button type="button"
                      onclick="$(this).parent('div').remove();">Remove</button>`
    answers.appendChild(answ)
}

function AddQuestion() {
    console.log("Building Question")
    const questiontype = document.getElementById("questiontype").value == "txt" ? "TextQuestions" : "MultipleChoice";
    const points = Number.parseInt(document.getElementById("points").value);
    const title = document.getElementById("questiontitle").value;
    const q_text = document.getElementById("q_text").value;
    const ex_ans = document.getElementById("ex_ans").value;
    const topicID = Number.parseInt(document.getElementById("topics").value);

    question = {
        typ: questiontype,
        points: points,
        title: title,
        question: q_text,
        topicID: topicID
    }
    if (questiontype == "MultipleChoice") {
        // Build Answers List
        var answers = [];
        var children = [...document.getElementById("answers-mult").children];
        console.log(children)
        children.forEach(answer => {
            answers.push({
                name: answer.children[1].value,
                correct: answer.children[0].checked
            })
        });
        question.answers = answers;
    }
    else {
        question.exAns = ex_ans;
    }
    console.log(question)
    fetch("/api/createQuestion", {
        method: "PUT",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(question)
    }).then(response => {
        if (response.status != 204)
            return
        // Reset Site to default (we don't want reloads)
        document.getElementById("points").value = "";
        document.getElementById("questiontitle").value = "";
        document.getElementById("q_text").value = "";
        document.getElementById("ex_ans").value = "";
        document.getElementById("answers-mult").innerHTML = `<div class="answer">
            <input type="checkbox"><input type="text" placeholder="Example Answer"><button>Remove</button>
          </div>`;
        document.getElementById("topics").value = "";
        document.getElementById("questiontype").value = "";
        document.getElementById("txt").hidden = true;
        document.getElementById("mult").hidden = true;
        refresh();
    })
}

function Modify(id, tablename) {
    // Show Popup to modify
    const popup = document.getElementById("modify-popup")
    popup.toggleAttribute("hidden")
    popup.modify_id = id
    popup.modify_tablename = tablename
}

function sendModifyRequest() {
    const popup = document.getElementById("modify-popup")

    const input_title = document.getElementById("modify-input-title").value
    const input_question = document.getElementById("modify-input-question").value
    const input_points = document.getElementById("modify-input-points").value

    const inputs = {
        title: input_title,
        question: input_question,
        points: input_points
    }

    let body = {}

    // Modify Text Question
    for (const key in inputs) {
        if (inputs[key] != "") {
            body = {
                tablename: popup.modify_tablename,
                attribute: { [key]: inputs[key] },
                condi: { questionID: popup.modify_id }
            }
            fetch("/api/modify", {
                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }).then(response => {
                if (response.status == 204)
                    refresh()
            })
        }
    }

    // Modify Multiple Choice Question
    for (const key in inputs) {
        if (inputs[key] != "") {
            body = {
                tablename: popup.modify_tablename,
                attribute: { [key]: inputs[key] },
                condi: { questionID: popup.modify_id }
            }
            fetch("/api/modify", {
                method: "PATCH",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            }).then(response => {
                if (response.status == 204)
                    refresh()
            })
        }
    }



    console.log(body)

    // Reset Popup
    document.getElementById("modify-input-title").value = ""
    document.getElementById("modify-input-question").value = ""
    document.getElementById("modify-input-points").value = ""
    popup.toggleAttribute("hidden");
    search()
}

function refresh() {
    loadTopics();
    update_questions()
}
refresh()