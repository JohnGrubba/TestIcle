import html_to_pdf from 'html-pdf-node'
import fs from "fs"

var multiple_choice_template = `
<div class="question">
    <h3>{title} <a>_____ / {points}</a></h3>
    <p>{text}</p>
    <div class="multiple-choice">
        {answers}
    </div>
</div>
<div class="page-break"></div>
`
var multiple_choice_answer_template = `
<div class="answer">
    <input type="radio" {checked}>
    <label>{answer}</label>
</div>
`
var text_question_template = `
<div class="question">
    <h3>{title} <a>_____ / {points}</a></h3>
    <p>{text}</p>
    <div class="answer-placeholder" style="color: red;">{answer}</div>
</div>
<div class="page-break"></div>
`

export function gen_test(test, format = "A4", corrected_test = false, shuffle_questions = false, shuffle_answers = false, grade_sheet = null) {
    let options = {
        format: format,
        margin: {
            top: '20px',
            bottom: '20px',
            left: '20px',
            right: '20px'
        }
    }
    // Read Template Test
    let data = fs.readFileSync('./test_icle/modules/template.html', 'utf8')

    // Determine Subject (more topics of one subject count more)
    var counts = {}
    const subjects = Object.values(test.topics).map((topic) => { return topic.subjectName })
    for (const subj of subjects) {
        counts[subj] = counts[subj] ? counts[subj] + 1 : 1;
    }
    const subject = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0]

    // Make actual Test
    data = data.replace(/{title}/g, test.title)
    data = data.replace(/{date}/g, test.date)
    data = data.replace(/{subject}/g, subject)

    // Replace all Media in HTML
    test = JSON.stringify(test)
    test = test.replace(/\!([^}]+)\!/g, (_, url) => {
        return "<img width='200' src='" + url + "'></img>"
    })
    test = JSON.parse(test)

    var total_points = 0

    // Generate Test Questions HTML Code
    var questionsHTML = []
    // Multiple Choice Questions first
    test.multipleChoice.forEach(question => {
        total_points += question.points
        var mc = multiple_choice_template
        mc = mc.replace(/{title}/g, question.title).replace(/{text}/g, question.question)
        // Replace Question Points
        mc = mc.replace(/{points}/g, question.points)

        // Construct Answers
        var mca = ""
        if (shuffle_answers)
            question.answers = question.answers.sort(() => Math.random() - 0.5)
        question.answers.forEach(answer => {
            // If a corrected test is wanted
            if (corrected_test && answer.correct)
                mca += multiple_choice_answer_template.replace(/{answer}/g, answer.name).replace(/{checked}/g, "checked")
            else
                mca += multiple_choice_answer_template.replace(/{answer}/g, answer.name).replace(/{checked}/g, "")
        })

        // Add Answers to Whole Question
        mc = mc.replace(/{answers}/g, mca)
        questionsHTML.push(mc)
    })

    // Now Text Questions
    test.textQuestions.forEach(question => {
        total_points += question.points
        var tq = text_question_template
        tq = tq.replace(/{title}/g, question.title).replace(/{text}/g, question.question)
        // Replace Question Points
        tq = tq.replace(/{points}/g, question.points)

        // If a example answer is wanted
        if (corrected_test)
            tq = tq.replace(/{answer}/g, question.exAns)
        else
            tq = tq.replace(/{answer}/g, "")
        questionsHTML.push(tq)
    })

    // Shuffle Questions order if wanted
    if (shuffle_questions)
        questionsHTML = questionsHTML.sort(() => Math.random() - 0.5)

    // Join Questions
    questionsHTML = questionsHTML.join("")

    data = data.replace(/{questions}/g, questionsHTML)

    // Set Total Points
    data = data.replace(/{points}/g, total_points)

    // Set Grading Sheet
    var grading_html = "";
    if (grade_sheet != null) {
        var grade_keys = Object.keys(grade_sheet);
        for (let idx = 0; idx < grade_keys.length; idx++) {
            let min, max, grade;
            if (idx == 0) {
                // First Grade should always be the worst (0- percentage)
                min = 0;
            }
            else
                min = Math.trunc((grade_keys[idx - 1] / 100) * total_points);
            if (idx == grade_keys.length - 1) {
                // Last Element (fulfill points to max)
                max = total_points;
            }
            else
                max = Math.trunc(((grade_keys[idx] / 100) * total_points) - 1);
            grade = grade_sheet[grade_keys[idx]]
            grading_html += `<p>${min} - ${max}: ${grade}</p>`
        }
    }

    data = data.replace(/{grading_sheet}/g, grading_html)

    // Add Logo (optional)
    if (test.logo != "")
        data = data.replace(/{logo}/g, `http://localhost:3000/api/logo/${test.ID}`)
    else
        data = data.replace(/{logo}/g, "")

    let file = { content: data }
    return new Promise((resolve, reject) => {
        html_to_pdf.generatePdf(file, options).then(pdfBuffer => { resolve(pdfBuffer) })
    })
}