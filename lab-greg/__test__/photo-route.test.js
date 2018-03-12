'use strict';

const request = require('superagent');
const server = require('../server.js');
const serverToggle = require('../lib/server-toggle.js');

const Photo = require('../model/photo.js');
const User = require('../model/user.js');
const List= require('../model/list.js');

require('jest');

const url = 'http://localhost:3000';

const exampleUser = {
  username: 'goopy',
  password: '01234hdhdh',
  email: 'sampleuser@test.com',
};

const exampleList = {
  name: 'a sample list',
  desc: 'a sample list description',
};

const examplePhoto = {
  name: 'sample photo',
  desc: 'sample photo description',
  image: `${__dirname}/../data/tester.jpg`,
};

describe('Photo Routes', function() {
  beforeAll( done => {
    serverToggle.serverOn(server, done);
  });

  beforeAll( done => {
    new User(exampleUser)
      .generatePasswordHash(exampleUser.password)
      .then( user => user.save())
      .then( user => {
        this.tempUser = user;
        return user.generateToken();
      })
      .then( token => {
        this.tempToken = token;
        done();
      })
      .catch(done);
  });
 
  beforeAll( done => {
    exampleList.userID = this.tempUser._id.toString();
    new List(exampleList).save()
      .then( list => {
        this.tempList = list;
        done();
      })
      .catch(done);
  });
  
  afterAll( done => {
    delete exampleList.userID;
    done();
  });
  
  afterAll( done => {
    serverToggle.serverOff(server, done);
  });

  afterAll( done => {
    Promise.all([
      Photo.remove({}),
      User.remove({}),
      List.remove({}),
    ])
      .then( () => done())
      .catch(done);
  });

  describe('POST: /api/list/:listID/photo', () => {
    describe('with a valid token and valid data', () => {
      it('should return a object containing our photo url', done => {
        request.post(`${url}/api/list/${this.tempList._id}/photo`)
          .set({
            Authorization: `Bearer ${this.tempToken}`,
          })
          .field('name', examplePhoto.name)
          .field('desc', examplePhoto.desc)
          .attach('image', examplePhoto.image)
          .end((err, res) => {
            if (err) return done(err);
            this.tempPhoto = res.body;
            expect(res.status).toEqual(200);
            expect(res.body.name).toEqual(examplePhoto.name);
            expect(res.body.desc).toEqual(examplePhoto.desc);
            expect(res.body.listID).toEqual(this.tempList._id.toString());
            done();
          });
      });
    });
  });

  describe('DELETE: /api/photo:photoID', () => {
    it('should delete a photo and return a 204 status', done => {
      request.delete(`${url}/api/photo/${this.tempPhoto._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`,
        })
        .end((err, res) => {
          if(err) return done(err);
          expect(res.status).toEqual(204);
          done();
        });
    });
  });
}); 