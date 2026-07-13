const express = require('express');
const router = express.Router();
const { getStudentResults, addStudentResult } = require('../controllers/studentResultController');
const StudentResult = require('../models/StudentResult');

router.get('/all', async(req,res)=>{
  try{
    const results = await StudentResult.find().populate('student','name roll dept');
    res.json(results);
  }catch(e){res.status(500).json({message:'Error',error:e});}
});

router.put('/update/:id', async(req,res)=>{
  try{
    const result = await StudentResult.findByIdAndUpdate(req.params.id, req.body, {new:true});
    res.json(result);
  }catch(e){res.status(500).json({message:'Error',error:e});}
});

router.delete('/update/:id', async(req,res)=>{
  try{
    await StudentResult.findByIdAndDelete(req.params.id);
    res.json({message:'Deleted'});
  }catch(e){res.status(500).json({message:'Error',error:e});}
});

router.get('/:studentId', getStudentResults);
router.post('/', addStudentResult);
router.put('/publish/:class', async(req,res)=>{
  try{
    const cls = decodeURIComponent(req.params.class);
    const {isPublished} = req.body;
    await StudentResult.updateMany({class:cls},{isPublished});
    res.json({message:`Results ${isPublished?'published':'unpublished'} for ${cls}`});
  }catch(e){res.status(500).json({message:'Error',error:e});}
});
module.exports = router;