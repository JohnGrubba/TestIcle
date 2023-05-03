import requests
import sqlite3
import unittest


DB = sqlite3.connect("../test_icle/db/tests.sqlite")
HOST = 'http://localhost:3000'
def test_get_entries():
    content = {
        "type": "example",
        "ordering": {
        "option": "example.name",
        "ordering" : "DESC"
        }
    }
    response = requests.post(HOST + '/api/getEntries', json=content)
    print(response.text)

def test_download():
    content = {
        "name": "converted",
        "path": "images/exampl_upload-1681122128939.png"
    }
    response = requests.post(HOST + '/api/download', json=content)
    print(response.text)

def test_upload():
    with open("exampl_upload.png", "rb") as f:
        files = {'content': f}
        data = {'name': f.name}
        response = requests.post(HOST + '/api/upload', data=data, files=files)
        print(response.text)

def test_create_multiple_choice_question():
    json = {
            "typ": "MultipleChoice",
            "questionID": 1,
            "points": 5,
            "title": "What is Programming?",
            "question": "What is Programming. Select the Correct answer.",
            "answers": [
                {
                    "answerID": 1,
                    "name": "Coding",
                    "correct": False
                },
                {
                    "answerID": 2,
                    "name": "Having Fun",
                    "correct": False
                },
                {
                    "answerID": 3,
                    "name": "Slowly Dying",
                    "correct": True
                }
            ]
        }
    print(requests.put(HOST + '/api/createQuestion', json=json).status_code == 204)

def test_create_test():
    json = {
        "title": "3AHIT Test",
        "date": "06.04.2023",
        "subject": 1,
        "multipleChoice": [
        {
        "questionID" : 1
        }
        ],
        "textQuestions" : [
            {
            "questionID": 1
            }
        ]
    }
    print(requests.put(HOST + '/api/createTest', json=json).status_code == 204)

def test_create_subject():
    json = {
        "name": "3AHIT SEW"
    }
    print(requests.put(HOST + '/api/createSubject', json=json).status_code == 204)

def test_pdf_create():
    json = { "testID" : 2}
    print(requests.post(HOST + '/api/pdf', json=json).status_code == 204)

def test_create_text_question():
    json = {
            "typ": "TextQuestions",
            "questionID": 1,
            "points": 10,
            "title": "What is Polymorphism?",
            "question": "Explain in simple terms, what Polymorphism is.",
            "exAns": "Polymorphism is one of the core concepts of object-oriented programming (OOP) and describes situations in which something occurs in several different forms. In computer science, it describes the concept that you can access objects of different types through the same interface. Each type can provide its own independent implementation of this interface."
        }
    print(requests.put(HOST + '/api/createQuestion', json=json).status_code == 204)


class TopicsTest(unittest.TestCase):
    def test(self):
        response = requests.get(HOST + '/api/getTopics')
        db_response = DB.execute("SELECT * FROM Topics").fetchall()
        
        all_entries = []
        for entry in response.json():
            new_entry = (entry["ID"], entry["topicName"], entry["subjectID"])
            all_entries.append(new_entry)
        self.assertEqual(db_response, all_entries)

class SubjectTest(unittest.TestCase):
    def test(self):
        response = requests.get(HOST + '/api/getSubjects')
        db_response = DB.execute("SELECT * FROM Subject").fetchall()
        
        all_entries = []
        for entry in response.json():
            new_entry = (entry["ID"], entry["subjectName"])
            all_entries.append(new_entry)
        self.assertEqual(db_response, all_entries)
    
class TestSubjectInsert(unittest.TestCase):
    def test(self):
        myTestName = "myExampleName"
        json = {
            "name" : myTestName
        }
        requests.put(HOST + '/api/createSubject', json=json)
        db_response = DB.execute("SELECT * FROM Subject").fetchall()

        self.assertEqual(db_response[-1][1], myTestName)

if __name__ == "__main__":
    unittest.main()


