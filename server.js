import express from "express";
import { gen_test } from "./test_icle/modules/test2pdf.js";
import * as globals from "./test_icle/globals.js";
import fs from "fs";
import chalk from "chalk";
import { TestIcle } from "./test_icle/test_icle.js";

const port = process.env.PORT || 8080;
const app = express();
const testicle_api = new TestIcle();
const log_path = "logs/generallog.log";

const PDF_HEADER = { "Content-Type": "application/pdf" };
const JSON_HEADER = { "Content-Type": "application/json" };

const log_types = {
  ERROR: chalk.red("[-]"),
  WARNING: chalk.yellow("[~]"),
  INFO: chalk.cyan("[*]"),
};

app.use(express.static("static"));
app.use(express.json({ limit: "100mb" }));

// This needs to be adjusted to the exact db-design later
app.put("/api/createQuestion", async (req, res) => {
  const typ = req.body.typ;
  const points = req.body.points;
  const title = req.body.title;
  const question = req.body.question;
  const exAns = req.body.exAns;
  const answers = req.body.answers;
  const topicID = req.body.topicID;
  try {
    const content = [points, title, question, exAns, topicID]
      .filter((element) => element !== undefined)
      .map((element) => (element ? element : null));

    if (typ == globals.MULTIPLE_CHOICE_TN) {
      await testicle_api.CreateMultQuestion(content, answers);
    } else if (typ == globals.TEXT_QUESTIONS_TN) {
      await testicle_api.CreateTextQuestion(content);
    } else {
      res.status(400).send("Unallowed question type").end();
      return;
    }
    log(`New question created! Questionname: ${title}`, log_types.INFO);
    res.writeHead(204).end();
  } catch (err) {
    log(err);
    res.status(400).send("Not all needed elements were supplied").end();
  }
});

app.put("/api/createSubject", async (req, res) => {
  const name = req.body.name;
  if (!name) {
    res.status(404).send("Not all needed Elements were supplied").end();
    return;
  }
  try {
    await testicle_api.CreateSubject([name]);
    res.status(204).end();
  } catch (err) {
    log(err, log_types.WARNING);
    res.status(400).send("Not all needed elements were supplied").end();
  }
});

app.put("/api/createTopic", async (req, res) => {
  const name = req.body.name;
  const subjectID = req.body.subjectID;
  if (!name) {
    res.status(404).send("Not all needed Elements were supplied").end();
    return;
  }
  try {
    await testicle_api.CreateTopic([name, subjectID]);
    res.status(204).end();
  } catch (err) {
    log(err, log_types.WARNING);
    res.status(400).send("Not all needed elements were supplied").end();
  }
});

app.put("/api/createTest", async (req, res) => {
  // Assumes that the questionID is present on the front-end
  const title = req.body.title;
  const date = req.body.date;
  const logo = req.body.logo;
  const limit = req.body.question_limit;
  const topics = req.body.topics;
  const multiple_choice = await testicle_api
    .GetRandomMultQuestions(limit, topics)
    .catch((err) => {
      log(err);
      res.status(400).write("Limit was of unallowed size");
    });
  const text_questions = await testicle_api
    .GetRandomTextQuestions(limit, topics)
    .catch((err) => {
      log(err);
      res.status(400).write("Limit was of unallowed size");
    });

  const content = [title, date, logo].map((element) =>
    element ? element : null
  );

  if (!text_questions && !multiple_choice) {
    res.status(400).write("Not matching questions found");
    res.end();
    return;
  }

  try {
    const test_id = await testicle_api.InsertIntoDB(
      globals.TEST_TN,
      content,
      true
    );

    for (let topic of topics) {
      testicle_api.InsertIntoDB(globals.TOPIC_TEST_TN, [test_id, topic]);
    }

    if (multiple_choice) {
      for (let question of multiple_choice) {
        testicle_api.InsertIntoDB(globals.TEST_MULTIPLE_CHOICE_TN, [
          test_id,
          question["questionID"],
        ]);
      }
    }

    if (text_questions) {
      for (let question of text_questions) {
        testicle_api.InsertIntoDB(globals.TEST_TXT_QUESTION_TN, [
          test_id,
          question["questionID"],
        ]);
      }
    }
    log(`New test created! Name of new test: ${title}`, log_types.INFO);
    res.status(204);
    res.end();
  } catch (err) {
    log(err, log_types.WARNING);
    res.status(400).write("Not all needed Elements were supplied");
    res.end();
    return;
  }
});

app.put("/api/createGrading", async (req, res) => {
  const sheet_name = req.body.sheet_name;
  const grading = req.body.grading;

  if (!sheet_name || !grading) {
    res.status(400).send("Not all needed Elements were supplied").end();
    return;
  }
  try {
    await testicle_api.CreateGrading(sheet_name, grading);
    res.status(204).end();
  } catch (err) {
    log(err, log_types.WARNING);
    res.status(400).send("Not all needed elements were supplied").end();
  }
})

app.get("/api/getGrading", async (req, res) => {
  try {
    let data = await testicle_api.GetGrading();
    for (let element of data) {
      element["Modify"] = element["ID"];
      element["Delete"] = element["ID"];
    }
    res.writeHead(200, JSON_HEADER);
    res.write(JSON.stringify(data));
  } catch (err) {
    log(err, log_types.WARNING);
    res.writeHead(400).write("Can't get from database");
  }
  res.end();
})

app.post("/api/modifyRandomTextQuestion", async (req, res) => {
  try {
    const testID = req.body.testID;
    const questionID = req.body.questionID;
    const resp = await testicle_api.GetRandomTextQuestionToTest(testID, questionID);

    if (resp["textQuestionID"]) {
      await testicle_api.DeleteEntry(globals.TEST_TXT_QUESTION_TN, { "textQuestionID": questionID, "testID": testID })
      await testicle_api.InsertIntoDB(globals.TEST_TXT_QUESTION_TN, [testID, resp["textQuestionID"]])
      res.writeHead(200, JSON_HEADER);
      res.write(JSON.stringify(resp));
    } else {
      res.writeHead(204).write("No matching entry found")
    }

  } catch (err) {
    log(err);
    res.writeHead(400).write("Invalid Param");
  }
  res.end();
});

app.post("/api/modifyRandomMult", async (req, res) => {
  try {
    const testID = req.body.testID;
    const questionID = req.body.questionID;
    const resp = await testicle_api.GetRandomMultChoiceToTest(testID, questionID);

    if (resp["multipleChoiceID"]) {
      await testicle_api.DeleteEntry(globals.TEST_MULTIPLE_CHOICE_TN, { "multipleChoiceID": questionID, "testID": testID });
      await testicle_api.InsertIntoDB(globals.TEST_MULTIPLE_CHOICE_TN, [testID, resp["multipleChoiceID"]])
      res.writeHead(200, JSON_HEADER);
      res.write(JSON.stringify(resp));
    } else {
      res.writeHead(204).write("No matching entry found")
    }
  } catch (err) {
    log(err);
    res.writeHead(400).write("Invalid Param");
  }
  res.end();
});

app.patch("/api/modify", async (req, res) => {
  const condi = req.body.condi;
  const tablename = req.body.tablename;
  const attribute_change = req.body.attribute;

  if (!condi || !tablename || !attribute_change) {
    res.status(400).send("Not all needed Elements were supplied").end();
    return;
  }

  try {
    await testicle_api.UpdateEntry(tablename, attribute_change, condi);
    res.status(204).end();
  } catch (err) {
    log(err, log_types.WARNING);
    res
      .status(404)
      .send("There was an error inserting into the database")
      .end();
  }
});

app.delete("/api/delete", async (req, res) => {
  const condi = req.body.condi;
  const tablename = req.body.tablename;
  if (!condi || !tablename) {
    res.status(400).send("Not all needed Elements were supplied").end();
    return;
  }

  try {
    await testicle_api.DeleteEntry(tablename, condi);
    res.status(204).end();
  } catch (err) {
    log(err, log_types.WARNING);
    res
      .status(404)
      .send("There was an error inserting into the database")
      .end();
  }
});

// Normal Generation is /api/pdf/1/ (with 1 being the ID of the test)
// Correction Generation is /api/pdf/1/corrected (you can write whatever you want as second param)
app.get("/api/pdf/*/*", async (req, res) => {
  const id = Number.parseInt(req.params[0].split(".")[0]);

  try {
    var test_body = await testicle_api.GetAllTestData(id);
  } catch (err) {
    log(
      `An Error Occured when trying to get the body of a test. TestID: ${id}. Error: ${err}`,
      log_types.ERROR
    );
    res.status(400).write("There is no test with the requested id");
    res.end();
    return;
  }
  if (test_body[0]) {
    const pdf_content = await gen_test(test_body[0], "A4", req.params[1]).catch(
      (err) => {
        log(err);
        res.status(404);
        res.end();
        return;
      }
    );
    log(`New PDF created from test with id: ${id}`, log_types.INFO);
    res.writeHead(200, PDF_HEADER);
    res.write(pdf_content);
  } else {
    log(`Test doesnt exist`, log_types.WARNING);
    res.status(404);
  }
  res.end();
});

app.get("/api/getSubjects", async (req, res) => {
  try {
    let data = await testicle_api.GetAllSubjects();
    for (let element of data) {
      element["Modify"] = element["ID"];
      element["Delete"] = element["ID"];
    }
    res.writeHead(200, JSON_HEADER);
    res.write(JSON.stringify(data));
  } catch (err) {
    log(err, log_types.WARNING);
    res.writeHead(400).write("Can't get from database");
  }
  res.end();
});

app.get("/api/getTests", async (req, res) => {
  const resp = await testicle_api.GetAllTestData().catch((err) => {
    log(err, log_types.ERROR);
  });
  if (resp) {
    res.writeHead(200, JSON_HEADER);
    res.write(JSON.stringify(resp));
  } else {
    log("No Tests were found!", log_types.WARNING);
    res.writeHead(400);
  }
  res.end();
});

app.get("/api/getTopics", async (req, res) => {
  try {
    let data = await testicle_api.GetAllTopics();
    for (let element of data) {
      element["Modify"] = element["ID"];
      element["Delete"] = element["ID"];
    }
    res.writeHead(200, JSON_HEADER);
    res.write(JSON.stringify(data));
  } catch (err) {
    log(err, log_types.WARNING);
    res.writeHead(400).write("Can't get from database");
  }
  res.end();
});

app.get("/api/logo/*", async (req, res) => {
  const id = req.params[0].split(".")[0];

  try {
    var logo = await testicle_api.GetLogo(id);
  } catch (err) {
    res.writeHead(200).end()
    return
  }

  try {
    if (logo[0].logo == null) {
      log("This Test doesn't exist or doesn't have a logo", log_types.WARNING);
      res.writeHead(200).end();
      return;
    }
  } catch (err) {
    log(err, log_types.ERROR);
    res.writeHead(200).end();
    return
  }

  try {
    const b64 = logo[0].logo.split(";base64,")[1];
    const buffer = new Buffer.from(b64, "base64");
    res.status(200).contentType("image/png").write(buffer);
  }
  catch (err) {
    log(err)
    res.writeHead(200);
  }
  res.end();
});

app.get("/api/getQuestions", async (req, res) => {
  const resp = await testicle_api.GetAllQuestions();

  if (resp) {
    res.writeHead(200, JSON_HEADER);
    res.write(JSON.stringify(resp));
  } else {
    log("No Questions were found!", log_types.WARNING);
    res.writeHead(400);
  }

  res.end();
});

function log(message, info = log_types.ERROR) {
  const log_msg = format_log(message, info);
  console.log(log_msg.trim());
  fs.appendFile(log_path, log_msg, function (err) {
    if (err) throw err;
  });
}

function format_log(message, info = log_types.ERROR) {
  return `${info} ${chalk.blue(new Date().toLocaleString())} - ${message}\n`;
}

fs.mkdir("logs", (err) => {
  if (err) {
    log("Can't make new directory. Error: " + err, log_types.WARNING);
  } else {
    log("Logs directory created", log_types.INFO);
  }
});

app.listen(port, (err) => {
  if (err) {
    log(err, log_types.ERROR);
  } else {
    log("Server listening on port: " + port, log_types.INFO);
  }
});
