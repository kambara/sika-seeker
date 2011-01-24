# -*- coding: utf-8 -*-

import sys
import os
import time
import base64
from datetime import datetime
from google.appengine.ext.webapp import template
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext import db
from django.utils import simplejson
from google.appengine.api import mail

class Location(db.Model):
  name = db.StringProperty(required=True)
  latitude  = db.FloatProperty(required=True)
  longitude = db.FloatProperty(required=True)
  photo = db.StringProperty()
  image = db.BlobProperty()
  datetime = db.DateTimeProperty(required=True, auto_now=True)

class MainPage(webapp.RequestHandler):
  def get(self):
    template_values = {}
    path = os.path.join(os.path.dirname(__file__), 'index.html')
    self.response.out.write(template.render(path, template_values))

class PostLocation(webapp.RequestHandler):
  def get(self):
    try:
      location = Location(name = self.request.get('user'),
                          latitude = float(self.request.get('lat')),
                          longitude = float(self.request.get('lon')),
                          photo = self.request.get('photo')
                          )
      location.put()

      e_mail=self.request.get('e_mail')
      if mail.is_email_valid(e_mail):
        sender_address = "kuma924.yahoo@gmail.com"
        subject = u"シカ見たなう"
        body = u"シカ出現！\n\nhttp://sika-map.appspot.com/"
        mail.send_mail(sender_address, e_mail, subject, body)

      self.response.out.write('ok')
    except:
      self.response.out.write('error: ' + str(sys.exc_info()[1]))

class PostLocation2(webapp.RequestHandler):
  def post(self):
    try:
      ## TODO: Base64で送られてきた画像を保存
      image = self.request.get('image')
      location = Location(name = self.request.get('user'),
                          latitude = float(self.request.get('lat')),
                          longitude = float(self.request.get('lon')),
                          photo = self.request.get('photo'),
                          image = db.Blob( base64.b64decode(image) )
                          )
      location.put()

      # e_mail=self.request.get('e_mail')
      # if mail.is_email_valid(e_mail):
      #   sender_address = "kuma924.yahoo@gmail.com"
      #   subject = u"シカ見たなう"
      #   body = "http://www.sika-map.appspot.com"
      #   mail.send_mail(sender_address, e_mail, subject, body)

      self.response.out.write('ok')
    except:
      self.response.out.write('error: ' + str(sys.exc_info()[1]))


class Locations(webapp.RequestHandler):
  def get(self):
    if self.request.get('prev'):
      t = int(self.request.get('prev')) + 1
      prev_datetime = datetime.fromtimestamp(t)
      locations = Location.all().filter('datetime >', prev_datetime).order('datetime').fetch(500)
    else:
      locations = Location.all().order('datetime').fetch(500)

    data = []
    for loc in locations:
      data.append({
          'id': loc.key().id(),
          'name': loc.name,
          'latitude':  loc.latitude,
          'longitude': loc.longitude,
          'time': int(time.mktime(loc.datetime.timetuple())),
          'has_image': 1 if loc.image else 0
          })
    json = simplejson.dumps(data)
    self.response.content_type = 'application/json'
    self.response.out.write(json)

class GetImage(webapp.RequestHandler):
  def get(self):
    ## 画像を返す
    id = int(self.request.get('id'))
    location = Location.get_by_id(id)
    self.response.headers['Content-Type'] = "image/jpeg"
    self.response.out.write(location.image)

application = webapp.WSGIApplication([('/', MainPage),
                                      ('/post_location', PostLocation),
                                      ('/post_location2',PostLocation2),
                                      ('/locations', Locations),
                                      ('/image', GetImage)
                                      ],
                                     debug=True)

def main():
  run_wsgi_app(application)

if __name__ == "__main__":
  main()
