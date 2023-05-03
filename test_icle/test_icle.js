import { DBInteraction } from "./db_interaction.js";
import * as globals from "./globals.js";

const tests_db = new DBInteraction();

/**
 * @brief The API of the TestIcle System
 */
export class TestIcle {
  /**
   *
   * @param {*} limit Maximum amount of questions returned
   * @param {*} topicIDs From which topics the quesitons should be selected
   * @brief Selects a limited amount of questions from certain topics, randomizes and returns them
   * @returns JSON -> A JSON which consists of question informations in random order
   */
  async GetRandomMultQuestions(limit = 0, topicIDs = []) {
    let selects = [];
    for (let topic of topicIDs) {
      selects.push({ "MultipleChoice.topicID": topic });
    }

    return tests_db
      .SelectFromDB(
        globals.MULTIPLE_CHOICE_TN,
        [
          "MultipleChoice.questionID",
          "MultipleChoice.points",
          "MultipleChoice.title",
          "MultipleChoice.question",
          "MultipleChoice.topicID",
          "Topics.topicName",
          "Subject.ID",
          "Subject.subjectName",
        ],
        selects ? selects : undefined,
        "RANDOM()",
        {
          joins: [
            {
              joinon: "Subject",
              eq1: "Subject.ID",
              eq2: "Topics.subjectID",
            },
          ],
        },
        true,
        limit
      )
      .catch((err) => {
        throw err;
      });
  }

  /**
   *
   * @param {*} limit Maximum amount of questions returned
   * @param {*} topicIDs From which topics the quesitons should be selected
   * @brief Selects a limited amount of questions from certain topics, randomizes and returns them
   * @returns JSON -> A JSON which consists of question informations in random order
   */
  async GetRandomTextQuestions(limit = 0, topicIDs = []) {
    let selects = [];
    for (let topic of topicIDs) {
      selects.push({ "TextQuestions.topicID": topic });
    }
    return tests_db
      .SelectFromDB(
        globals.TEXT_QUESTIONS_TN,
        [
          "TextQuestions.questionID",
          "TextQuestions.points",
          "TextQuestions.title",
          "TextQuestions.question",
          "TextQuestions.exAns",
          "Topics.ID",
          "Topics.topicName",
          "Subject.ID",
          "Subject.subjectName",
        ],
        selects ? selects : undefined,
        "RANDOM()",
        {
          joins: [
            {
              joinon: "Subject",
              eq1: "Subject.ID",
              eq2: "Topics.subjectID",
            },
          ],
        },
        true,
        limit
      )
      .catch((err) => {
        throw err;
      });
  }

  /**
   *
   * @param {*} content The values which are needed to construct a multiple choice question
   * @param {*} answers The answers which belong to this multiple choice question
   * @brief Creates a new MultipleChoice Question with answers in the database
   */
  async CreateMultQuestion(content, answers) {
    const pk_id = await tests_db.InsertIntoDB(
      globals.MULTIPLE_CHOICE_TN,
      content,
      true
    );
    for await (let answer of answers) {
      let question_content = [pk_id, answer["name"], answer["correct"]];
      await tests_db.InsertIntoDB(
        globals.MULTIPLE_CHOICE_ANS_TN,
        question_content
      ); // Change this name to the actual name in future
    }
  }

  /**
   *
   * @param {*} content The values needed to construct a TextQuestion
   * @brief Creates a new text question
   */
  async CreateTextQuestion(content) {
    await tests_db.InsertIntoDB(globals.TEXT_QUESTIONS_TN, content);
  }

  /**
   *
   * @param {*} content The values needed to construct a new Subject
   * @brief Creates a new Subject
   */
  async CreateSubject(content) {
    await tests_db.InsertIntoDB(globals.SUBJECT_TN, content, false);
  }

  /**
   *
   * @param {*} tablename Into which table should be inserted
   * @param {*} content The values which should be inserted
   * @param {*} last_id If the id of the last insert should be returned
   * @brief A general insert statement
   * @returns An empty promise
   */
  async InsertIntoDB(tablename, content, last_id = false) {
    /**
     * Just a general fucntion for better readability
     */
    return tests_db.InsertIntoDB(tablename, content, last_id);
  }

  /**
   *
   * @param {*} id The id of the test from which to get the data from
   * @brief Executes select statements to join all information together
   * @returns The assembled test data
   */
  async GetAllTestData(id = -1) {
    if (typeof id !== "number") {
      return Promise.reject(
        `The Id was of unallowed input. Input: ${id}, Type: ${typeof id}.`
      );
    }

    return tests_db
      .SelectFromDB(
        "Tests",
        ["Tests.title", "Tests.date", "Tests.ID"],
        id == -1 ? undefined : [{ "Tests.ID": id }],
        undefined,
        undefined,
        true
      )
      .then(async (test_body) => {
        for (let test of test_body) {
          let multipleChoice = await tests_db
            .SelectFromDB(
              "TestMultipleChoice",
              [
                "MultipleChoice.questionID",
                "MultipleChoice.points",
                "MultipleChoice.title",
                "MultipleChoice.question",
                "Topics.topicName",
              ],
              [{ "TestMultipleChoice.testID": test["ID"] }],
              undefined,
              {
                joins: [
                  {
                    joinon: "Topics",
                    eq1: "Topics.ID",
                    eq2: "MultipleChoice.topicID",
                  },
                ],
              },
              true
            )
            .catch((err) => {
              return Promise.reject(err);
            });
          multipleChoice = await this.GetAnswersToQuestions(multipleChoice);

          const textQuestions = await tests_db.SelectFromDB(
            "TestTextQuestions",
            [
              "TextQuestions.questionID",
              "TextQuestions.points",
              "TextQuestions.title",
              "TextQuestions.question",
              "TextQuestions.exAns",
              "Topics.topicName",
            ],
            [{ "TestTextQuestions.testID": test["ID"] }],
            undefined,
            {
              joins: [
                {
                  joinon: "Topics",
                  eq1: "Topics.ID",
                  eq2: "TextQuestions.topicID",
                },
              ],
            },
            true
          );
          const topics = await tests_db.SelectFromDB(
            globals.TOPIC_TEST_TN,
            ["Topics.topicName", "TestTopics.topicID", "Subject.subjectName"],
            [{ testID: test["ID"] }],
            undefined,
            {
              joins: [
                {
                  joinon: "Topics",
                  eq1: "Topics.ID",
                  eq2: "TestTopics.topicID",
                },
                {
                  joinon: "Subject",
                  eq1: "Topics.subjectID",
                  eq2: "Subject.ID",
                },
              ],
            },
            false
          );

          test["topics"] = topics;
          test["multipleChoice"] = multipleChoice;
          test["textQuestions"] = textQuestions;
        }
        return test_body;
      });
  }

  /**
   *
   * @returns All questions in the database joined together with their according answers
   */
  async GetQuestionsWithAnswers() {
    let multipleChoice = await tests_db.SelectFromDB(
      globals.MULTIPLE_CHOICE_TN,
      [
        "MultipleChoice.questionID",
        "MultipleChoice.points",
        "MultipleChoice.title",
        "MultipleChoice.question",
        "Topics.ID",
        "Topics.topicName",
        "Subject.subjectName",
      ],
      undefined,
      undefined,
      {
        joins: [
          { joinon: "Subject", eq1: "Topics.subjectID", eq2: "Subject.ID" },
        ],
      },
      true
    );
    return await this.GetAnswersToQuestions(multipleChoice);
  }

  /**
   *
   * @param {*} question_response Full question entry like they are in the database
   * @returns Answers joined together with their according questions
   */
  async GetAnswersToQuestions(question_response) {
    let tmp = question_response;
    let questions = [];
    for (let question of tmp) {
      const multipleChoiceAnswers = await tests_db.SelectFromDB(
        globals.MULTIPLE_CHOICE_ANS_TN,
        ["answerID", "name", "correct"],
        [
          {
            "MultipleChoiceAnswers.answerID": question["questionID"],
          },
        ],
        undefined,
        {
          joins: [
            {
              joinon: "MultipleChoice",
              eq1: "MultipleChoiceAnswers.answerID",
              eq2: "MultipleChoice.questionID",
            },
          ],
        }
      );

      question["answers"] = multipleChoiceAnswers;

      for (let answer of question["answers"]) {
        answer["correct"] = answer["correct"] == 1;
      }
      questions.push(question);
    }
    return tmp;
  }

  /**
   *
   * @returns All Questions which are in the database
   */
  async GetAllQuestions() {
    const multipleChoice = await this.GetQuestionsWithAnswers();

    const textQuestions = await tests_db.SelectFromDB(
      "TextQuestions",
      [
        "questionID",
        "points",
        "title",
        "question",
        "exAns",
        "Topics.ID",
        "Topics.topicName",
        "Subject.subjectName",
      ],
      undefined,
      undefined,
      {
        joins: [
          { joinon: "Subject", eq1: "Topics.subjectID", eq2: "Subject.ID" },
        ],
      },
      true
    );

    return { mult: multipleChoice, text: textQuestions };
  }

  /**
   *
   * @param {*} limit The maximum size of subjects returned
   * @returns All Subjects found in the database
   */
  async GetAllSubjects(limit = 0) {
    return await tests_db.SelectFromDB(
      globals.SUBJECT_TN,
      undefined,
      undefined,
      undefined,
      undefined,
      true,
      limit
    );
  }

  /**
   *
   * @param {*} id From which logo the data should be selected
   * @returns The Logo data (as a BLOB)
   */
  async GetLogo(id = undefined) {
    return await tests_db.SelectFromDB(
      globals.TEST_TN,
      ["Tests.logo"],
      [
        {
          ID: id,
        },
      ]
    );
  }

  /**
   *
   * @param {*} tablename In which table should the Update be executed
   * @param {*} attribute_change Which attribute should be changed to what. Style -> {attributename : change}
   * @param {*} condi Which condition should match for the entry to be updated. Style -> {attributename : valueToMatch}
   */
  async UpdateEntry(tablename, attribute_change, condi) {
    await tests_db.UpdateEntry(tablename, attribute_change, condi);
  }

  /**
   *
   * @param {*} tablename From which table should be deleted
   * @param {*} condi Which condition should match for the entry to be deleted. Style -> {attributename : valueToMatch}
   */
  async DeleteEntry(tablename, condi) {
    await tests_db.DeleteEntry(tablename, condi);
  }

  /**
   *
   * @param {*} content The values needed to create a new topic
   */
  async CreateTopic(content) {
    await tests_db.InsertIntoDB(globals.TOPIC_TN, content);
  }

  /**
   *
   * @param {*} limit The maximum size of subjects returned
   * @returns All Topics which are in the database
   */
  async GetAllTopics(limit = 0) {
    return await tests_db.SelectFromDB(
      globals.TOPIC_TN,
      [
        "Topics.ID",
        "Topics.topicName",
        "Subject.subjectName",
        "Topics.subjectID",
      ],
      undefined,
      undefined,
      undefined,
      true,
      limit
    );
  }

  /**
   *
   * @param {*} testid For which test there should be a random question returned
   * @param {*} questionID For which question the new random question should be selected
   * @returns A new random text question
   */
  async GetRandomTextQuestionToTest(testid, questionID) {
    let topicID = await tests_db.SelectFromDB(
      globals.TEXT_QUESTIONS_TN,
      ["TextQuestions.topicID"],
      [{ "TextQuestions.questionID": questionID }],
      "RANDOM()"
    );

    topicID = topicID[0]["topicID"];

    const textQuestions = await tests_db.SelectFromDB(
      globals.TEXT_QUESTIONS_TN,
      ["TextQuestions.questionID"],
      [{ "TextQuestions.topicID": topicID }]
    );

    const testtotxt = await tests_db.SelectFromDB(
      globals.TEST_TXT_QUESTION_TN,
      ["TestTextQuestions.textQuestionID"],
      [{ "TestTextQuestions.testID": testid }],
      "RANDOM()",
      undefined,
      true
    );

    const questions = textQuestions.map((entry) => entry["questionID"]);
    const unallowed = testtotxt.map((entry) => entry["textQuestionID"]);
    const allowed = questions
      .map((entry) => {
        if (!unallowed.includes(entry)) {
          return entry;
        }
      })
      .filter((entry) => entry != undefined);
    return { textQuestionID: allowed[0] };
  }

  /**
   *
   * @param {*} testid For which test there should be a random question returned
   * @param {*} questionID For which question the new random question should be selected
   * @returns A new random multiple choice question
   */
  async GetRandomMultChoiceToTest(testid, questionID) {
    let topicID = await tests_db.SelectFromDB(
      globals.MULTIPLE_CHOICE_TN,
      ["MultipleChoice.topicID"],
      [{ "MultipleChoice.questionID": questionID }]
    );

    topicID = topicID[0]["topicID"];
    const multQuestions = await tests_db.SelectFromDB(
      globals.MULTIPLE_CHOICE_TN,
      ["MultipleChoice.questionID"],
      [{ "MultipleChoice.topicID": topicID }],
      "RANDOM()"
    );

    const testtomult = await tests_db.SelectFromDB(
      globals.TEST_MULTIPLE_CHOICE_TN,
      ["TestMultipleChoice.multipleChoiceID"],
      [{ "TestMultipleChoice.testID": testid }],
      "RANDOM()",
      undefined,
      true
    );
    const questions = multQuestions.map((entry) => entry["questionID"]);
    const unallowed = testtomult.map((entry) => entry["multipleChoiceID"]);
    const allowed = questions
      .map((entry) => {
        if (!unallowed.includes(entry)) {
          return entry;
        }
      })
      .filter((entry) => entry != undefined);
    return { multipleChoiceID: allowed[0] };
  }
}
