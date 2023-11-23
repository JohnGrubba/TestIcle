input_logo = document.getElementById("logo")

// Convert Upload to Base64 for easier storing
toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
});

function loadTests() {
    fetch('/api/getTests', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        return response.json()
    }).then(data => {
        console.log(data);
        var test_html = "";
        data.forEach(test => {
            // Create Topics List
            var topics_html = `<ul>`
            test.topics.forEach(topic => {
                topics_html += `<li>${topic.topicName}</li>`
            })
            topics_html += `</ul >`
            // Create Questions List
            var questions_html = `<ul>`
            test.multipleChoice.forEach(question => {
                questions_html += `<li class="questns">${question.title} (${question.topicName}) <button class="swap_btn" onclick="swap(${question.questionID}, ${test.ID}, false)"><span class="material-symbols-outlined">swap_horiz</span></button></li>`
            })
            test.textQuestions.forEach(question => {
                questions_html += `<li class="questns">${question.title} (${question.topicName}) <button class="swap_btn" onclick="swap(${question.questionID}, ${test.ID}, true)"><span class="material-symbols-outlined">swap_horiz</span></button></li>`
            })
            questions_html += `</ul >`

            test_html += `
            <tr>
            <button type="button" class="collapsible">${test.title}</button>
            <div class="content">
                <b>Topics: </b>
                <p>${topics_html}</p>
                <p style="position: absolute;right: 0;top: 0;padding: 10px;color: rgb(120, 120, 120)">${test.date}</p>
                <b>Questions: </b>
                <p>${questions_html}</p>
                <br>
                <b>Logo: </b>
                <br><br>
                <img src="/api/logo/${test.ID}" height="50px" onerror="this.onerror=null; this.src='icons/fallbackimg.jpg'">
                <br><br>
                <div class="stretch">
                    <button style="width: 100%" class="buttonDownload" onclick="dl_test(${test.ID})">Download</button>
                    <button style="width: 100%" class="buttonDownload" onclick="dl_test(${test.ID}, 'true')">Download Corrected</button>
                    <button style="width: 100%" class="download-button" onclick="Delete({ ID: ${Number.parseInt(test.ID)} }, 'Tests')"><span
                    class="material-symbols-outlined">delete</span></button>
                </div>
            </div>
            </tr>
            `
        });
        document.getElementById("test_list").innerHTML = test_html;
        addCollapsibleFunction();
        // Update Placeholders
        if (data.length > 0)
            $("#test_list").next().hide()
        else
            $("#test_list").next().show()
    });

}

function swap(qid, test_id, txt) {
    var payload = {
        testID: Number.parseInt(test_id),
        questionID: Number.parseInt(qid),
    }
    if (txt)
        url = "/api/modifyRandomTextQuestion"
    else {
        url = "/api/modifyRandomMult"
    }

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(response => {
        if (response.status != 200 && response.status != 204)
            return;
        refresh();
    })
}

function dl_test(test_id, corrected = "") {
    console.log("Preparing Test...")
    $('#anim').fadeIn(500);
    fetch(`/api/pdf/${test_id}/${corrected}`, {
        method: "GET"
    }, {
    }).then((response) => {
        return response.blob()
    }).then((blob) => {
        console.log(blob);
        var file = new Blob([blob], { type: 'application/pdf' });
        var fileURL = URL.createObjectURL(file);
        window.open(fileURL);
        $('#anim').hide();
    })

}

async function GenerateTest() {
    const title = document.getElementById("testtitle")
    const date = document.getElementById("testdate")
    const file = document.getElementById("logo")
    const logo_b64 = file.files[0] != undefined ? await toBase64(file.files[0]) : undefined
    const topic_id = $('#topics')
    const txt_limit = document.getElementById("textlimit")
    const mult_limit = document.getElementById("multlimit")
    const grading_sheet = document.getElementById("grdsht")

    const payload = {
        title: title.value,
        date: date.value,
        topics: topic_id.val().map(i => Number(i)),
        logo: logo_b64,
        txt_limit: Number.parseInt(txt_limit.value),
        mult_limit: Number.parseInt(mult_limit.value),
        gradingsheet: Number.parseInt(grading_sheet.value)
    }

    fetch("/api/createTest", {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    }).then(response => {
        if (response.status != 204)
            return;
        title.value = "";
        date.value = "";
        file.files = null;
        topic_id.value = "";
        txt_limit.value = "";
        mult_limit.value = "";
        refresh();
    })
}

function refresh() {
    addCollapsibleFunction();
    loadTopics();
    loadTests();
    loadGradingSheet();
}

refresh();