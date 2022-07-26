const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const Blog = require("../models/blog");
const User = require('../models/user');

const api = supertest(app);

const InitialBlogs = [
  {
    title: "How to test API's in NodeJs",
    author: "McCodeson",
    url: "www.dingleberries.com",
    likes: 1
  },
  {
    title: "The empty mind",
    author: "Deep Derpson",
    url: "www.empty.com",
    likes: 123456
  }
];

const fetchTokenForRootUser = async () => {
  const rootUser = {
    username: 'root',
    password: 'sekret'
  }
  const loginResponse = await api.post("/api/login").send(rootUser);
  const token = loginResponse.body.token
  return token
}

const fetchTokenForBobUser = async () => {
  const bobUser = {
    username: 'bob',
    password: '123'
  }
  const loginResponse = await api.post("/api/login").send(bobUser);
  const token = loginResponse.body.token
  return token
}

beforeEach(async () => {
  const token = await fetchTokenForRootUser();
  
  await Blog.deleteMany({});

  for (let blog of InitialBlogs) {
    let blogObject = new Blog(blog);
    //console.log(JSON.stringify(blogObject))
    let response = await api.post("/api/blogs")
    .set('Content-Type', 'application/json')
    .set('Authorization', `bearer ${token}`)
    .send(JSON.stringify(blogObject))
  }
});

describe("get a blog", () => {
  test("blogs are returned as json", async () => {

    await api
      .get("/api/blogs")
      .expect(200)
      .expect("Content-Type", /application\/json/);
  });

  test("there are two blogs", async () => {

    const response = await api.get("/api/blogs")

    expect(response.body).toHaveLength(2);
  });

  test("the first blog is about APIs", async () => {
    const response = await api.get("/api/blogs");

    expect(response.body[0].title).toContain("API");
  });

  test("all blogs are returned", async () => {
    const response = await api.get("/api/blogs");

    expect(response.body).toHaveLength(InitialBlogs.length);
  });

  test("a specific url can be found within the returned blogs", async () => {
    const response = await api.get("/api/blogs");

    const contents = response.body.map((r) => r.url);
    expect(contents).toContain("www.empty.com");
  });

  test("the unique identifier of a blog, called id, is returned", async () => {
    const response = await api.get("/api/blogs");
    expect(response.body[0].id).toBeDefined();
  });
});

describe("post a blog", () => {
  test("making a http post request successfully creates a new blog", async () => {
    const token = await fetchTokenForRootUser();

    const newBlog = {
      title: "The thrid element",
      author: "Fire and Ice",
      url: "www.john.com",
      likes: 12345
    };

    await api
      .post("/api/blogs")
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const response = await api.get("/api/blogs");
    expect(response.body).toHaveLength(3);
  });

  test("posting a new blog with undefined likes will default to 0 likes.", async () => {
    const token = await fetchTokenForRootUser();

    const newBlog = {
      title: "The fourth element",
      author: "Mostly Earth",
      url: "www.elements.com"
    };

    await api
      .post("/api/blogs")
      .set('Authorization', `bearer ${token}`)
      .send(newBlog)
      .expect(201)
      .expect("Content-Type", /application\/json/);

    const response = await api.get("/api/blogs");
    expect(response.body[2].likes).toBe(0);
  });

  test("posting a new blog with undefined title will return bad request.", async () => {
    const token = await fetchTokenForRootUser();

    const newBlog = {
      author: "Mostly air",
      url: "www.farts.com"
    };

    await api
    .post("/api/blogs")
    .set('Authorization', `bearer ${token}`)
    .send(newBlog)
    .expect(400);
  });

  test("posting a new blog with undefined url will return bad request.", async () => {
    const token = await fetchTokenForRootUser();

    const newBlog = {
      title: "The fifth element",
      author: "Mostly air"
    };

    await api.post("/api/blogs")
    .set('Authorization', `bearer ${token}`)
    .send(newBlog)
    .expect(400);
  });

  test("posting a new blog without a valid token will return a 401 error code.", async () => {

    const newBlog = {
      title: "The fifth element",
      author: "Mostly air",
      url: "www.hotairballons.dk"
    };

    await api.post("/api/blogs")
    .send(newBlog)
    .expect(401);
  });
});

describe("delete a blog", () => {
  test("making a http delete request successfully deletes the specified blog", async () => {
    const token = await fetchTokenForRootUser();

    const getResponse = await api.get("/api/blogs");
    const idToDelete = getResponse.body[0].id

    await api
    .delete(`/api/blogs/${idToDelete}`)
    .set('Authorization', `bearer ${token}`)
    .expect(204);

    const secondGetResponse = await api.get("/api/blogs");
    expect(secondGetResponse.body[0].id).not.toContain(idToDelete);
  });

  test("making a http delete request with an invalid id returns a 404 error code", async () => {
    const token = await fetchTokenForRootUser();

    const getResponse = await api.get("/api/blogs");
    const idToDelete = getResponse.body[0].id;
    const badIdToDelete = "62dedd7b5e8503619b04f44d";

    await api
    .delete(`/api/blogs/${badIdToDelete}`)
    .set('Authorization', `bearer ${token}`)
    .expect(404);

    const secondGetResponse = await api.get("/api/blogs");
    expect(secondGetResponse.body[0].id).toContain(idToDelete);
  });

  test("making a http delete request with an unauthorized user returns a 403 error code", async () => {
    const token = await fetchTokenForBobUser();

    const getResponse = await api.get("/api/blogs");
    const idToDelete = getResponse.body[0].id;

    await api
    .delete(`/api/blogs/${idToDelete}`)
    .set('Authorization', `bearer ${token}`)
    .expect(403);

    const secondGetResponse = await api.get("/api/blogs");
    expect(secondGetResponse.body[0].id).toContain(idToDelete);
  });

  test("making a http delete request without a user token returns a 401 error code", async () => {

    const getResponse = await api.get("/api/blogs");
    const idToDelete = getResponse.body[0].id;

    await api
    .delete(`/api/blogs/${idToDelete}`)
    .expect(401);

    const secondGetResponse = await api.get("/api/blogs");
    expect(secondGetResponse.body[0].id).toContain(idToDelete);
  });

});

describe("update a blog", () => {
  test("making a http put request successfully updates the specified blog", async () => {
    const listOfBlogs = await api.get("/api/blogs");
    const idToUpdate = listOfBlogs.body[0].id;

    const response = await api.get(`/api/blogs/${idToUpdate}`);

    const updatedBlog = {
      title: response.body.title,
      author: response.body.author,
      url: response.body.url,
      likes: response.body.likes + 100,
    };

    await api.put(`/api/blogs/${idToUpdate}`).send(updatedBlog).expect(200);

    const secondGetResponse = await api.get("/api/blogs");
    expect(secondGetResponse.body[0].likes).toBe(101);
  });

  test("making a http put request with a wrong id returns a bad request", async () => {
    const listOfBlogs = await api.get("/api/blogs");
    const idToUpdate = listOfBlogs.body[0].id;

    const response = await api.get(`/api/blogs/${idToUpdate}`);

    const updatedBlog = {
      title: response.body.title,
      author: response.body.author,
      url: response.body.url,
      likes: response.body.likes + 100,
    };

    const badIdToUpdate = "lol1234";

    await api.put(`/api/blogs/${badIdToUpdate}`).send(updatedBlog).expect(400);

    const secondGetResponse = await api.get("/api/blogs");
    expect(secondGetResponse.body[0].likes).toBe(1);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
