import { gen_test } from './test_icle/modules/test2pdf.js'
import fs from "fs"

let example_test = {
    title: "3AHIT Test",
    date: "06.04.2023",
    subject: "Software developement",
    multipleChoice: [
        {
            questionID: 1,
            points: 5,
            title: "Basic Knowledge",
            question: "What is Programming. Select the Correct answer.",
            answers: [
                {
                    answerID: 1,
                    name: "Coding",
                    correct: false
                },
                {
                    answerID: 2,
                    name: "Having Fun",
                    correct: false
                },
                {
                    answerID: 3,
                    name: "Slowly Dying",
                    correct: true
                }
            ]
        },
        {
            questionID: 2,
            points: 15,
            title: "Who is the Genius",
            question: "Who programmed this great Test Generator?",
            answers: [
                {
                    answerID: 1,
                    name: "JJ",
                    correct: true
                },
                {
                    answerID: 2,
                    name: "Jonas",
                    correct: true
                },
                {
                    answerID: 3,
                    name: "Jonas Grubbauer",
                    correct: true
                },
                {
                    answerID: 4,
                    name: "Grubbauer Jonas",
                    correct: true
                },
            ]
        },
        {
            questionID: 3,
            points: 150,
            title: "Who is Deminatorus",
            question: "Wrong answers only...",
            answers: [
                {
                    answerID: 1,
                    name: "Geilomat15",
                    correct: false
                },
                {
                    answerID: 2,
                    name: "Demi",
                    correct: true
                },
                {
                    answerID: 3,
                    name: "Ali",
                    correct: true
                },
                {
                    answerID: 4,
                    name: "Fortnite",
                    correct: true
                },
            ]
        }
    ],
    textQuestions: [
        {
            questionID: 1,
            points: 2,
            title: "What is Polymorphism?",
            question: "Explain in simple terms, what Polymorphism is. !https://openbook.rheinwerk-verlag.de/oop/bilderklein/klein04_strukturvonooprogrammen_01_015.gif!",
            exAns: "Polymorphism is one of the core concepts of object-oriented programming (OOP) and describes situations in which something occurs in several different forms. In computer science, it describes the concept that you can access objects of different types through the same interface. Each type can provide its own independent implementation of this interface."
        },
        {
            questionID: 2,
            points: 4,
            title: "Renaissance",
            question: "Explain the Renaissance",
            exAns: "The Renaissance was a period of cultural, artistic, and intellectual revival in Europe during the 14th to 17th centuries."
        }
    ]
}

let example_test1 = {
    title: "2. MEDT Test",
    date: "09.04.2023",
    subject: "Medientechnik",
    logo: "https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_HTL_Weiz_2013.png",
    multipleChoice: [
        {
            questionID: 1,
            points: 5,
            title: "Know your Teacher",
            question: "Who is Werner Krausler?",
            answers: [
                {
                    answerID: 1,
                    name: "The Worlds best teacher",
                    correct: false
                },
                {
                    answerID: 2,
                    name: "Appleprofessor",
                    correct: true
                },
                {
                    answerID: 3,
                    name: "Woerny",
                    correct: true
                }
            ]
        },
        {
            questionID: 2,
            points: 2,
            title: "Cameras",
            question: "What is a Camera? Pick the most accurate Answer.",
            answers: [
                {
                    answerID: 1,
                    name: "A Camera",
                    correct: true
                },
                {
                    answerID: 2,
                    name: "A Device",
                    correct: false
                },
                {
                    answerID: 3,
                    name: "A Photosensitive Electrical Device",
                    correct: false
                },
                {
                    answerID: 4,
                    name: "The Rock",
                    correct: false
                },
            ]
        },
        {
            questionID: 3,
            points: 8,
            title: "Adobe",
            question: "Check all Softwares which have been released by Adobe.",
            answers: [
                {
                    answerID: 1,
                    name: "Premiere Pro",
                    correct: true
                },
                {
                    answerID: 2,
                    name: "Fortnite",
                    correct: false
                },
                {
                    answerID: 3,
                    name: "Photoshop",
                    correct: false
                },
                {
                    answerID: 4,
                    name: "Among Us",
                    correct: false
                },
                {
                    answerID: 5,
                    name: "Photoshop",
                    correct: true
                }
            ]
        }
    ],
    textQuestions: [
        {
            questionID: 1,
            points: 10,
            title: "Photoshop",
            question: "Explain how Photoshop works and what the benefits of it are. !https://cdn.pixabay.com/photo/2015/11/27/10/55/photoshop-1065296_960_720.jpg!",
            exAns: "Photoshop is a popular and powerful graphics editing software developed and published by Adobe Inc. It is widely used by graphic designers, photographers, artists, and web developers for various purposes, such as image editing, compositing, and retouching. With Photoshop, users can manipulate and enhance images in a variety of ways, including adjusting colors and brightness, adding text and shapes, removing or adding objects, and applying filters and effects. Photoshop also offers advanced features like layers, masks, and 3D editing, making it a versatile tool for creating various types of digital content."
        },
        {
            questionID: 2,
            points: 5,
            title: "Premiere Pro",
            question: "Explain how Premiere Pro is the best Video Editing Software on the Planet.",
            exAns: "Adobe Premiere Pro is a comprehensive and professional-grade video editing software that offers a wide range of tools and features for editing and producing high-quality videos. It supports a wide range of video formats and provides features like color correction, audio mixing, and special effects. Premiere Pro also offers a powerful timeline-based editing interface that allows users to easily arrange and edit video clips, audio tracks, and effects."
        },
        {
            questionID: 3,
            points: 8,
            title: "Lightroom",
            question: "Explain how Lightroom is the best Photo Editing Software on the Planet.",
            exAns: "Adobe Lightroom is a powerful photo editing software that allows users to edit and organize their photos. It offers a wide range of tools and features for editing and organizing photos, including color correction, cropping, and special effects. Lightroom also offers a powerful timeline-based editing interface that allows users to easily arrange and edit video clips, audio tracks, and effects."
        },
        {
            questionID: 4,
            points: 2,
            title: "After Effects",
            question: "What can you do with After Effects?",
            exAns: "Adobe After Effects is a powerful video editing software that allows users to create and edit videos. It offers a wide range of tools and features for editing and organizing videos, including color correction, cropping, and special effects. After Effects also offers a powerful timeline-based editing interface that allows users to easily arrange and edit video clips, audio tracks, and effects."
        }

    ]
}

var grade_sheet = {
    100: "1",  // 95 - 100%
    95: "2",
    85: "3",
    75: "4", // 75 - 84%
    65: "5"
}

var grade_sheet1 = {
    100: "A", // 90 - 100%
    90: "B",
    80: "C",
    70: "D", // 70 - 79%
    60: "E",
    50: "F" // 0 - 49%
}

gen_test(example_test, "A4", false, false, false, grade_sheet).then(buffer => {
    fs.writeFileSync("test1.pdf", buffer)
})
gen_test(example_test, "A4", true, false, false, grade_sheet).then(buffer => {
    fs.writeFileSync("test1_corrected.pdf", buffer)
})

gen_test(example_test1, "A4", false, true, true, grade_sheet1).then(buffer => {
    fs.writeFileSync("test2.pdf", buffer)
})
gen_test(example_test1, "A4", true, false, false, grade_sheet1).then(buffer => {
    fs.writeFileSync("test2_corrected.pdf", buffer)
})