const blogModel = require('../models/blog')
const blogRouter = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const middleware = require('../utils/middleware')

blogRouter.get('/', async (request, response) => {
    const blogs = await blogModel.find({}).populate('user')
    response.json(blogs)
})

blogRouter.get('/:id', async (request, response) => {
  const specificBlog = await blogModel.findById(request.params.id).populate('user')
  response.json(specificBlog)
})

blogRouter.delete('/:id', middleware.userExtractor, async (request, response) => {
  const specificBlog = await blogModel.findById(request.params.id)
  if (!specificBlog) {
    response.status(404).json({ error: 'blogpost not found' })  
  }
  if (request.user._id.toString() === specificBlog.user.toString()) {
    await blogModel.findByIdAndDelete(request.params.id)
    response.status(204).end()
  } else {
    response.status(403).json({ error: 'a blog post can only be deleted by the user who created it' })  
  }
})

blogRouter.put('/:id', async (request, response) => {

  const newBlog = {
    "title": request.body.title,
    "author": request.body.author,
    "url": request.body.url,
    "likes": request.body.likes,
    "user": request.body.user
  }
  const updatedBlog = await blogModel
  .findByIdAndUpdate(request.params.id, newBlog, {
     new: true, runValidators: true, context: 'query' 
    })
  response.json(updatedBlog)
})

blogRouter.post('/', middleware.userExtractor, async (request, response) => {
  const user = await User.findById(request.user)
  const blog = new blogModel({
    "title": request.body.title,
    "author": request.body.author,
    "url": request.body.url,
    "likes": request.body.likes,
    "user": user._id
  })
  const result = await blog.save();
  response.status(201).json(result)
})

module.exports = blogRouter