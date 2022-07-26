const blog = require("../models/blog");

const dummy = (blogs) => {
    return 1;
}

const totalLikes = (blogs) => {
    let count = 0;
    blogs.forEach(blog => {
        count += blog.likes;
    });

    return count;
}

const favoriteBlog = (blogs) => {
    const listOfLikes = blogs.map(b => b.likes);
    const maxLikes = Math.max(...listOfLikes);
    const indexOfMax = listOfLikes.indexOf(maxLikes);
    const mostLikedBlog = blogs[indexOfMax];

    return {
        "title": mostLikedBlog.title,
        "author": mostLikedBlog.author,
        "likes": mostLikedBlog.likes
    }
}

const mostBlogs = (blogs) => {
    const mapOfAuthors = new Map();
    const listOfAuthors = blogs.map(blog => blog.author);
    listOfAuthors.forEach(author => mapOfAuthors.set(author, (mapOfAuthors.get(author) || 0) + 1))
    const mostProlificAuthor =  [...mapOfAuthors.entries()].reduce((a, b) => a[1] > b[1] ? a : b)
    return {
        "author": mostProlificAuthor[0],
        "blogs": mostProlificAuthor[1]
    }
}

const mostLikes = (blogs) => {
    const mapOfAuthors = new Map();
    blogs.forEach(blog => mapOfAuthors.set(blog.author, (mapOfAuthors.get(blog.author) || 0) + blog.likes))
    const mostProlificAuthor =  [...mapOfAuthors.entries()].reduce((a, b) => a[1] > b[1] ? a : b)
    return {
        "author": mostProlificAuthor[0],
        "likes": mostProlificAuthor[1]
    }
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}
