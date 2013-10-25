define(
  'mapObjectsView', 
  ['underscore', 'backbone', 'mapObjectsViewModel'], 
  function(_, Backbone, MapObjectsViewModel) {

  'use strict'

  /*
  * Routes map view
  */
  var RoutesMapView = Backbone.View.extend({
    
    el: $('#routes-map-view'),

    events: {
      'change #input-speed-value': 'userChangeSpeed',
      'change #input-graduality-value': 'userChangeGraduality',
      'change #input-time': 'userChangeTime',
      'click #button-play': 'userPlay',
      'click #button-pause': 'userPause',
      'click #button-autozoom': 'userAutoZoom',
      'click #map-objects-header input[type=checkbox]:first': 'userToggleAllObjects',
      'click #map-objects-header input[type=checkbox]:last': 'userToggleAllRoutes',
    },

    initialize: function() {
      this.viewModel = new MapObjectsViewModel;

      this.buttonPlay = this.$('#button-play');
      this.buttonPause = this.$('#button-pause');
      this.spanSpeedValue = this.$('#span-speed-value');
      this.inputSpeedValue = this.$('#input-speed-value');
      this.spanGradualityValue = this.$('#span-graduality-value');
      this.inputGradualityValue = this.$('#input-graduality-value');
      this.labelBeginTime = this.$('#bar-time-ranges div:first-child > span');
      this.labelCurrentTime = this.$('span[name=routes-currenttime]');
      this.labelEndTime = this.$('#bar-time-ranges div:last-child > span');
      this.inputTime = this.$('#input-time');
      this.objectsListView = this.$('#map-objects-list');
      this.checkboxAllObjects = this.$('#map-objects-header input[type=checkbox]:first');
      this.checkboxAllRoutes = this.$('#map-objects-header input[type=checkbox]:last');

      this.objectsList = {};

      // Connect view to view-model
      this.viewModel
        .on('change:currentTime', function() {
          this.labelCurrentTime.text(
            this.viewModel.has('currentTime') ? (new Date(this.viewModel.currentTime() * 1000)).toLocaleString() : '');
          this.inputTime.prop('disabled', !this.viewModel.has('currentTime') || this.viewModel.realtime());
          this.inputTime.val(this.viewModel.currentTime());
        }.bind(this))
        .on('change:beginTime', function() {
          if (this.viewModel.has('beginTime')) {
            this.inputTime.prop('min', this.viewModel.get('beginTime'));
            this.labelBeginTime.text((new Date(this.viewModel.get('beginTime') * 1000)).toLocaleString());
          } else {
            this.labelBeginTime.text('');
          }
        }.bind(this))
        .on('change:endTime', function() {
          if (this.viewModel.has('endTime')) {
            this.inputTime.prop('max', this.viewModel.get('endTime'));
            this.labelEndTime.text((new Date(this.viewModel.get('endTime') * 1000)).toLocaleString());
          } else {
            this.labelEndTime.text('');
          }
        }.bind(this))
        .on('change:speed', function() {
          if (this.viewModel.has('speed')) {
            var currentSpeed = this.viewModel.get('speed');
            this.spanSpeedValue.text(currentSpeed);
            this.inputSpeedValue.val(currentSpeed);
            this.inputSpeedValue.prop('disabled', false);
          } else {
            this.spanSpeedValue.text('');
            this.inputSpeedValue.prop('disabled', true);
          }
        }.bind(this))
        .on('change:graduality', function() {
          if (this.viewModel.has('graduality')) {
            var currentGraduality = this.viewModel.get('graduality');
            this.spanGradualityValue.text(currentGraduality);
            this.inputGradualityValue.val(currentGraduality);
            this.inputGradualityValue.prop('disabled', false);
          } else {
            this.spanGradualityValue.text('');
            this.inputGradualityValue.prop('disabled', true);
          }
        }.bind(this))
        .on('change:playInterval change:currentTime change:realtime', function() {
          var isPlaying = this.viewModel.has('playInterval');
          var realtime = this.viewModel.realtime();
          this.buttonPlay.prop('disabled', (!this.viewModel.has('currentTime') || isPlaying) || realtime);
          this.buttonPause.prop('disabled', (!isPlaying) || realtime);
        }.bind(this))
        .on('change:realtime', function() {
          var realtime = this.viewModel.realtime();
          
          if (realtime) {
            this.inputSpeedValue.parent().hide();
            this.inputGradualityValue.parent().hide();
          } else {
            this.inputSpeedValue.parent().show();
            this.inputGradualityValue.parent().show();
          }

          this.buttonPlay.prop('disabled', realtime);
          this.buttonPause.prop('disabled', realtime);
          this.inputTime.prop('disabled', realtime);
        }.bind(this))
        .trigger('change:currentTime change:beginTime change:endTime change:speed change:graduality change:playInterval change:realtime');

        this.listenTo(this.viewModel.collection, 'add', function(model) {
          var lvItem = this.objectsList[model.modelId()] = new MapObjectListViewItem({model: model});
          this.objectsListView.append(lvItem.render().el);
        }.bind(this));

        this.listenTo(this.viewModel.collection, 'reset', function() {
          this.objectsListView.empty();
          this.objectsList = {};
        }.bind(this));

        this.listenTo(this.viewModel.collection, 'remove', function(model) {
          var id = model.modelId();
          var lvItem = this.objectsList[id];
          if (lvItem) {
            lvItem.$el.remove();
            delete this.objectsList[id];
          }
        }.bind(this));

        this.viewModel.collection
          .on('change:showAllObjects', function(model, showAllObjects) {
            this.checkboxAllObjects.prop('checked', showAllObjects);
          }.bind(this))
          .on('change:showAllRoutes', function(model, showAllRoutes) {
            this.checkboxAllRoutes.prop('checked', showAllRoutes);
          }.bind(this));
    },

    // Event handlers
    userChangeSpeed: function() {
      var isPlaying = this.viewModel.has('playInterval');
      if (isPlaying) this.viewModel.pause();
      this.viewModel.set('speed', this.inputSpeedValue.val());
      if (isPlaying) this.viewModel.play();
    },

    userChangeGraduality: function() {
      var isPlaying = this.viewModel.has('playInterval');
      if (isPlaying) this.viewModel.pause();
      this.viewModel.set('graduality', parseFloat(this.inputGradualityValue.val()));
      if (isPlaying) this.viewModel.play();
    },

    userChangeTime: function() {
      this.viewModel.pause();
      this.viewModel.currentTime(parseFloat(this.inputTime.val()));
    },

    userPlay: function() {
      this.viewModel.play();
    },

    userPause: function() {
      this.viewModel.pause();
    },

    userAutoZoom: function() {
      this.viewModel.autoZoom();
    },

    userToggleAllRoutes: function() {
      var value = this.checkboxAllRoutes.prop('checked');
      this.viewModel.collection.showAllRoutes(value);
    },

    userToggleAllObjects: function() {
      this.viewModel.pause();
      var value = this.checkboxAllObjects.prop('checked');
      this.viewModel.collection.showAllObjects(value);
    },

    renderPoints: function(dataPoints) {
      var hasData = this.viewModel.has('currentTime');
      if (!hasData) {
        if (!this.viewModel.collection.showAllObjects()) {
          this.checkboxAllObjects.prop('checked', true);
          this.viewModel.collection.showAllObjects(true);
        }
        if (this.viewModel.collection.showAllRoutes()) {
          this.checkboxAllRoutes.prop('checked', false);
          this.viewModel.collection.showAllRoutes(false);
        }
      }

      this.viewModel.addDataPoints(dataPoints);
      
      if (!hasData) {
        this.viewModel.autoZoom();
      }

      this._sortObjectsList();

      this.viewModel.play();
    },

    _sortObjectsList: function() {
        // Get all list view items
        var lvItems = _.values(this.objectsList);
        // Detach all ui elements from list
        _.each(lvItems, function(lvItem){
          lvItem.$el.detach();
        });
        // Sort them by title
        lvItems = _.sortBy(lvItems, function(lvItem) {
          return lvItem.model.get('title');
        });
        // Append items again
        _.each(lvItems, function(lvItem) {
          this.objectsListView.append(lvItem.el);
        }.bind(this));
      }
  });

  var MapObjectListViewItem = Backbone.View.extend({
    
    tagName: 'li',

    template: _.template($('#map-object-list-template').html()),

    events: {
      'click input[type=checkbox]:first': 'toggleShowObject',
      'click input[type=checkbox]:last': 'toggleShowRoute',
      'click a.colorBlock': 'highlightObject'
    },

    initialize: function() {
      this.model
        .on('change:showRoute', function(model, showRoute) {
            this.$('input[type=checkbox]:last').prop('checked', showRoute);
          }.bind(this))
        .on('change:showObject', function(model, showObject) {
            this.$('input[type=checkbox]:first').prop('checked', showObject);
          }.bind(this));
    },

    render: function() {
      this.$el.html(this.template(this.model.toJSON()));
      return this;
    },

    toggleShowObject: function() {
      this.model.toggleShowObject();
    },

    toggleShowRoute: function() {
      this.model.toggleShowRoute();
    },

    highlightObject: function() {
      this.model.highlightObject();
    }
  })

  // Require export (create new travel system)
  return RoutesMapView;
});

