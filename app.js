const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(bodyParser.json());


const uri = "mongodb+srv://aasim:XfpFdiCzA3zYUPen@cluster0.kulamu6.mongodb.net/?retryWrites=true&w=majority";


mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});



 

const studentSchema = new mongoose.Schema({
  name: String,
  email: String,
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' },
  previousMentor: { type: mongoose.Schema.Types.ObjectId, ref: 'Mentor' },
});

const Student = mongoose.model('Student', studentSchema);

const mentorSchema = new mongoose.Schema({
  name: String,
  email: String,
});

const Mentor = mongoose.model('Mentor', mentorSchema);


  // Create a new student
app.post('/api/students', (req, res) => {
    const { name, email } = req.body;
    const student = new Student({ name, email });
  
    student.save()
    .then(savedStudent => {
      res.status(201).json(savedStudent);
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
  
  });
  
  // Create a new mentor
  app.post('/api/mentors', (req, res) => {
    const { name, email } = req.body;
    const mentor = new Mentor({ name, email });
  
    mentor.save()
    .then(savedMentor => {
      res.status(201).json(savedMentor);
    })
    .catch(err => {
      console.error('Error while creating a mentor:', err.message);
      res.status(500).json({ error: 'Mentor creation failed' });
    });
  
  });
  
  // Get a list of all students
  app.get('/api/students', (req, res) => {
    Student.find({})
  .then(students => {
    res.status(200).json(students);
  })
  .catch(err => {
    console.error('Error fetching students:', err.message);
    res.status(500).json({ error: 'Error fetching students' });
  });

  });
  
  // Get a list of all mentors
  app.get('/api/mentors', (req, res) => {
    Mentor.find({})
  .then(mentors => {
    res.status(200).json(mentors);
  })
  .catch(err => {
    console.error('Error fetching mentors:', err.message);
    res.status(500).json({ error: 'Error fetching mentors' });
  });

  });


// ...

// Assigning students
app.post('/api/assign-students/:mentorId', (req, res) => {
  const { mentorId } = req.params;
  const studentIds = req.body.studentIds; // An array of student IDs to assign

  

  // Find the mentor by ID
  Mentor.findById(mentorId)
    .then(mentor => {
      if (!mentor) {
        return res.status(404).json({ error: 'Mentor not found' });
      }

      // Find the students by their IDs
      return Student.find({ _id: { $in: studentIds } });
    })
    .then(students => {
      // Filter out students who already have a mentor
      const unassignedStudents = students.filter(student => !student.mentor);

      // Update mentor for the unassigned students
      return Student.updateMany(
        { _id: { $in: unassignedStudents.map(student => student._id) } },
        { mentor: mentorId }
      );
    })
    .then(() => {
      res.status(200).json({ message: 'Students assigned to mentor successfully' });
    })
    .catch(err => {
      console.error('Error assigning students to mentor:', err.message);
      res.status(500).json({ error: 'Error assigning students to mentor' });
    });
});

// Change the mentor for a particular student and store the previous mentor
app.put('/api/change-mentor/:studentId', (req, res) => {
    const { studentId } = req.params;
    const newMentorId = req.body.newMentorId; // The new mentor's ID
  
    // Find the student by ID
    Student.findById(studentId)
  .then(student => {
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Store the current mentor as the previous mentor
    student.previousMentor = student.mentor;

    // Set the new mentor
    student.mentor = newMentorId;

    return student.save();
  })
  .then(updatedStudent => {
    res.status(200).json(updatedStudent);
  })
  .catch(err => {
    res.status(500).json({ error: 'Error finding or updating the student' });
  });

    
    
    
  });

  

  // Show all students for a particular mentor
  app.get('/api/students-for-mentor/:mentorId', (req, res) => {
  const { mentorId } = req.params;

  // Find the mentor by ID
  Mentor.findById(mentorId)
    .then(mentor => {
      if (!mentor) {
        return res.status(404).json({ error: 'Mentor not found' });
      }

      // Find all students assigned to the mentor
      return Student.find({ mentor: mentorId });
    })
    .then(students => {
      res.status(200).json(students);
    })
    .catch(err => {
      console.error('Error fetching students for the mentor:', err.message);
      res.status(500).json({ error: 'Error fetching students for the mentor' });
    });

});

  

  // Change the mentor for a particular student and store the previous mentor
  app.put('/api/change-mentor/:studentId', (req, res) => {
    const { studentId } = req.params;
    const newMentorId = req.body.newMentorId; // The new mentor's ID
  
    // Find the student by ID
    Student.findById(studentId)
      .then(student => {
        if (!student) {
          return res.status(404).json({ error: 'Student not found' });
        }
  
        // Store the current mentor as the previous mentor
        student.previousMentor = student.mentor;
  
        // Set the new mentor
        student.mentor = newMentorId;
  
        return student.save();
      })
      .then(updatedStudent => {
        res.status(200).json(updatedStudent);
      })
      .catch(err => {
        console.error('Error changing mentor for the student:', err.message);
        res.status(500).json({ error: 'Error changing mentor for the student' });
      });
  });
  
  

  // Endpoint to get the previous mentor of a student by studentId

 // Endpoint to get the previous mentor of a student, including mentor details
app.get('/api/students/previous-mentor/:studentId', (req, res) => {
  const studentId = req.params.studentId;

  Student.findById(studentId)
    .then(student => {
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }

      const previousMentorId = student.previousMentor;

      Mentor.findById(previousMentorId)
        .then(previousMentor => {
          if (!previousMentor) {
            return res.status(404).json({ error: 'Previous mentor not found' });
          }

          // Return the previous mentor's details along with the ID
          res.json({
            previousMentorId: previousMentor._id,
            name: previousMentor.name,
            email: previousMentor.email,
          });
        })
        .catch(err => {
          res.status(500).json({ error: 'Error retrieving the previous mentor' });
        });
    })
    .catch(err => {
      res.status(500).json({ error: 'Error retrieving the student' });
    });
});

