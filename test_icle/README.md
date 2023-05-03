# Test_Icle

- A Test is structured in the following way
- Images or other media can be inserted using the following concept
    - !https://image.com/test.png!

```js
{
    title: "3AHIT Test",
    date: "06.04.2023",
    subject: "Software developement",
    multipleChoice: [
        {
            questionID: 1,
            points: 5,
            title: "What is Programming?",
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
        }
    ],
    textQuestions: [
        {
            questionID: 1,
            points: 10,
            title: "What is Polymorphism?",
            question: "Explain in simple terms, what Polymorphism is.",
            exAns: "Polymorphism is one of the core concepts of object-oriented programming (OOP) and describes situations in which something occurs in several different forms. In computer science, it describes the concept that you can access objects of different types through the same interface. Each type can provide its own independent implementation of this interface."
        },
        {
            questionID: 2,
            points: 10,
            title: "Renaissance",
            question: "Explain the Following Image. !https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg/310px-%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg!",
            exAns: "The image shows a typical contruction style of the Renaissance."
        }
    ]
}
```

## Grading Sheet

- You can enable this when generating a Test PDF to automatically generate a Grading Sheet on the Test, to make choosing the right grade easier.

- Example Grading Sheet (needs to be passed to the gen_test function)

```js
{
    100: "1",  // 95 - 100%
    95: "2",
    85: "3",
    75: "4", // 75 - 84%
    65: "5"
}
```

- Could also look like this

```js
{
    100: "A", // 90 - 100%
    90: "B",
    80: "C",
    70: "D", // 70 - 79%
    60: "E",
    50: "F" // 0 - 49%
}
```