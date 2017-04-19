angular.module('meals', ['ui.router'])
.config(["$stateProvider", "$urlRouterProvider", function($stateProvider, $urlRouterProvider) {
  // INITILIZE STATES
  // ============================================================
  $stateProvider
    // HOME STATE
    .state('home', {
      url: '/home',
      templateUrl: './app/routes/home/home.html',
      controller: 'homeCtrl'
    })
    // WELCOME STATE
    .state('welcome', {
      url: '/welcome',
      templateUrl: './app/routes/welcome/welcome.html',
      controller: 'welcomeCtrl'
    })
    // RECIPE STATE
    .state('recipes', {
      url: '/recipes',
      templateUrl: './app/routes/recipes/recipes.html',
      controller: 'recipesCtrl'
    })
    // GROCERY STATE
    .state('grocery', {
      url: '/grocery',
      templateUrl: './app/routes/grocery/grocery.html',
      controller: 'groceryCtrl'
    });




  // ASSIGN OTHERWISE
  // ============================================================
  $urlRouterProvider.otherwise('/home');
}]);

angular.module('meals')
.controller('ctrl', ["$scope", "mainService", function ($scope, mainService) {

}])

angular.module('meals')
.service('mainService', ["$http", "$state", function ($http, $state) {

  var self = this;

  this.login = function () {
    var info = {};
    console.log('log in attemped');
    return $http.get('/auth/me').then(function (response) {
      console.log('auth0 in service: ', response);
      self.userId = info.id =  response.data.id;
      self.userName = info.name = response.data._json.name;
      info.email = response.data._json.email;
      return response;
    })
    .then(function(response) {
      console.log('info: ', info);
      $http.post('/api/users', info)
    .then(function(response) {
      self.userTableId = info.owner = response.data[0].user_id
      localStorage.setItem('recipe-login', JSON.stringify(info));
      console.log('list of users: ', response);
      console.log('self.userTableId: ', self.userTableId);
    });
    });
  }

  this.getRecipes = function () {
    var owner = self.userTableId;
    return $http.get('/api/recipes' + owner);
  }


  this.getRecipe = function (id) {
    console.log('get the recipe: ', id);
    return $http.get('/api/recipe/' + id)
    .then(function(response) {
      return response.data;
    });
  }
  // this.certainRecipe = "";

  var mealList = [];
  this.addToList = function (id, name) {
    var arr = [];
    arr.push(id);
    arr.push(name);
    mealList.push(arr);
    console.log('mealList: ', mealList);
    return mealList;
  }

  this.removeMeal = function (meal) {
    console.log('removeMeal service: ', meal);
    for (var i = 0; i < mealList.length; i++) {
      console.log('forloop', mealList[i][0], meal[0]);
      if(mealList[i][0] === meal[0] &&
        mealList[i][1] === meal[1]){
          mealList.splice(i,1);
          break;
        }
    }
  }

  var ingredients = [];
  this.addIngredient = function (ingredient) {
    var ingredientArr = [];
    ingredientArr.push(ingredient.qty);
    ingredientArr.push(ingredient.measurement);
    ingredientArr.push(ingredient.name);
    ingredients.push(ingredientArr);
    console.log('ingredientz: ', ingredients, self.ingredients);
    self.ingredients=ingredients;
  }

  this.removeIngredient = function (ingredient) {
    for (var i = 0; i < ingredients.length; i++) {
      if(ingredients[i][0] === ingredient[0] &&
        ingredients[i][1] === ingredient[1] &&
        ingredients[i][2] === ingredient[2]){
          ingredients.splice(i,1);
          break;
        }
    }
  }

  this.refreshIngredients = function (ing) {
    ingredients = [];
    for (var i = 0; i < ing.length; i++) {
      var ingredientArr = [];
      ingredientArr.push(ing[i].qty);
      ingredientArr.push(ing[i].measure);
      ingredientArr.push(ing[i].name);
      ingredients.push(ingredientArr);
    }
    console.log('refreshed ingredients: ', ingredients);
    var userInfo = JSON.parse(localStorage.getItem('recipe-login')) || [];
    self.userTableId = userInfo.owner
    self.userId = userInfo.id
    self.userName = userInfo.name
    console.log('self.userId, self.userName: ', self.userId, self.userName);
    return ingredients;
  }

  this.refreshUserInfo = function(){
    var userInfo = JSON.parse(localStorage.getItem('recipe-login')) || [];
    self.userTableId = userInfo.owner
    self.userId = userInfo.id
    self.userName = userInfo.name
  }

  this.clearIngredients = function(){
    var ingredients = [];
    self.ingredients = [];
    this.ingredients = [];
    console.log('clear service: ', ingredients, self.ingredients);
  }

  this.ingredients = ingredients;

  this.submitRecipe = function (newRecipe) {

    var ingr = {};
    ingr.ingredients = ingredients;
    newRecipe.ingredients = ingredients;
    newRecipe.user=self.userTableId;
    console.log('newRecipe: ', newRecipe);
    return $http.post('/api/recipes', newRecipe)
    .then(function (res) {
      self.clearIngredients();
      console.log('res: ', res);
      ingr.recipeId = res.data[0].recipe_id;
      if(ingr.recipeId > 0){
        $http.post('/api/ingredients/' + ingr.recipeId, ingr);
      }
      else {
        return res;
      }
    });
  }

  this.updateRecipe = function (newRecipe) {
    newRecipe.ingredients = ingredients;
    console.log('newRecipe: ', newRecipe);
    return $http.put('/api/recipe/' + newRecipe.recipe_id, newRecipe);
  }

  this.deleteRecipe = function (id) {
    return $http.delete('/api/recipe/' + id)
    .then(function(response) {
      return response.data;
    });
  }

  self.groceryList;
  var groceryList = []
  this.makeList = function () {
    return $http.get('/api/gather/')
    // return $http.get('/api/gather/', {mealList})
    .then(function(response) {
      console.log('gathered: ', response);
      var tempArr = [];
      for (var i = 0; i < mealList.length; i++) {
        tempArr.push(mealList[i][0]);
      }
      for (var i = 0; i < response.data.length; i++) {
        for (var j = 0; j < tempArr.length; j++) {
          if(tempArr[j] === response.data[i].recipe_id){
            groceryList.push(response.data[i]);
          }
        }
      }
      self.groceryList = groceryList;
    }).then(function(response) {
      $state.go('grocery');
    });
  }

}])

angular.module('meals')
.component('editRecipe', {
    bindings: {
      certainRecipe: '=',
      update: '@'
    },
    templateUrl:'./app/components/editTemp.html',
    controller: ["mainService", "$rootScope", function (mainService, $rootScope){

      var $scope = this;
      var self = this;

      $rootScope.certainRecipe = [];


      this.refreshIt = function () {
        if(this.update==='true'){
          console.log('update?',this.newRecipe);
          this.newRecipe=$rootScope.certainRecipe[0];
          this.ingredientsList=mainService.refreshIngredients($rootScope.certainRecipe);
          // this.ingredientsList = mainService.ingredients;
        }
      }

      // this.ingredients = $rootScope.ingredients;

      $rootScope.$watch('certainRecipe',function() {
        console.log('watched');
        $scope.refreshIt();
      });

      // mainService.$watch('ingredients', function (value) {
      //   $scope.ingredientsList = value;
      // });

      this.submitRecipe = function(newRecipe) {
        newRecipe.name=newRecipe.rname;
        mainService.submitRecipe(newRecipe)
        .then(function (res) {
          $scope.rec = res;
          self.cleanSlate();
        })
      }

      this.cleanSlate = function(){
        console.log('then 1, clear: ', self.ingredientsList);
        $scope.newRecipe={};
        $scope.ingredient={};
        self.ingredientsList=[];
        mainService.clearIngredients();
        console.log('self.ingredientsList: ', self.ingredientsList);
      }

      this.updateRecipe = function(newRecipe) {
        mainService.updateRecipe(newRecipe).then(function (response) {
          console.log('updated response: ', response);
        })
      }

      this.addIngredient = function (ingredient) {
        mainService.addIngredient(ingredient);
        self.ingredientsList=mainService.ingredients;
      }

      this.ingredientsList = mainService.ingredients;

      this.removeIngredient = function (ingredients) {
        mainService.removeIngredient(ingredients);
      }

      this.deleteRecipe = function(id) {
        mainService.deleteRecipe(id)
        .then(function(response) {
          console.log('deleted?: ', response);
          self.cleanSlate();
        });
      }

      this.getRecipes = function () {
        mainService.getRecipes()
        .then(function(response) {
          $scope.allRecipes = response.data;
        });
      }

    }]
});

angular.module('meals')
.component('mealPlan', {
    bindings: {
        mealList: '='
    },
    templateUrl:'./app/components/planTemp.html',
    controller: ["mainService", "$rootScope", "$state", function (mainService, $rootScope, $state){

      var self = this;
      this.removeMeal = function (meal) {
        console.log('removeMeal contrl: ', meal);
        mainService.removeMeal(meal);
      }


    this.makeList = function (meals) {
      console.log('make list controller: ', self.listTitle);
      mainService.makeList(meals);
    }
  }]
});

angular.module('meals')
.component('singleRecipe', {
    bindings: {
        certainRecipe: '='
    },
    templateUrl:'./app/components/recipe_Temp.html',
    controller: ["mainService", "$rootScope", function (mainService, $rootScope){


    }]
});

angular.module('meals')
.component('allRecipes', {
    bindings: {
        eachRecipe: '=',
        certainRecipe: '=',
        mealList: '='
    },
    templateUrl:'./app/components/recipesTemp.html',
    controller: ["mainService", "$rootScope", function (mainService, $rootScope){

      var $scope = this;
      $scope.getRecipe = function(id) {
        mainService.getRecipe(id)
        .then(function(response) {
          console.log('the response is: ', response);
          $rootScope.certainRecipe = response;
          console.log('this.certainRecipe', $scope.certainRecipe);
        });
      }

      $scope.addToList = function(id, name) {
        console.log('add clicked');
        this.mealList = mainService.addToList(id, name);
        $rootScope.mealList = this.mealList;
      }

    }]
});


angular.module('meals').directive('dragDir', function() {
  return {
    restrict: 'A',
    link: function (scope, elem, attrs) {

      $('.print').on('click', function () {
        $('.cat').css('background-color','white');
        $('p').css('background-color','white');
        $('.grocery').css('width','800px');
      });

    }
  };
});


angular.module("meals").directive('homeAni', function() {
  return {
    restrict: 'A',
    link: function (scope, elem, attrs) {

      totHeight = window.screen.availHeight;
      totWidth = window.screen.availWidth;

      // $('.home-container').mousemove(function(event){
      //   $('.chandelier').css('imagewidth','100px');
      // });
      var fasterX = 3
      var fasterY = 2;
      $('.home-container').mousemove(function(event){
        // $("span").text(event.pageX + ", " + event.pageY+","+totWidth+".");

        $('.welcome-screen').css({
          'transform':'rotate(-5deg) scale(.5, .5)'
        });

        $('.counter').css({
          'transform':'translateX(' + -(event.pageX-totWidth/2) / 8 * fasterX + 'px) translateY(' + -(event.pageY-totHeight/2) / 6.5 * fasterY  + 'px) scale(1.3, 1.3)'
        });

        $('.chandelier').css({
          'transform':'translateX(' + -(event.pageX-totWidth/2) / 8.5 * fasterX  + 'px) translateY(' + -(event.pageY-totHeight/2) / 2.5 * fasterY + 'px) scale(1.3, 1.3)'
        });

        $('.fridge').css({
          'transform':'translateX(' + -(event.pageX-totWidth/2) / 10.5 * fasterX  + 'px) translateY(' + -(event.pageY-totHeight/2) / 10.5 * fasterY + 'px) scale(1.3, 1.3)'
        });

        $('.grass').css({
          'transform':'translateX(' + -(event.pageX-totWidth/2) / 11.5 * fasterX  + 'px) translateY(' + -(event.pageY-totHeight/2) / 11.5 * fasterY + 'px) scale(1.3, 1.3)'
        });

        $('.blurred').css({
          'transform':'translateX(' + -(event.pageX-totWidth/2) / 9.5 * fasterX  + 'px) translateY(' + -(event.pageY-totHeight/2) / 9.5 * fasterY + 'px) scale(1.3, 1.3)'
        });

      });

    }
  };
});


angular.module("meals").directive('recAni', function() {
  return {
    restrict: 'A',
    link: function (scope, elem, attrs) {
      // elem.on('click', function () {
      //   alert("alert works")
      // });
      var flipped = false;
      $('.select-recipe').on('click', function () {
        $('.get').css({'transform':'rotateY(180deg) rotateZ(-15deg) skew(-15deg,-15deg)'});
        $('.get').css('background-color','black');
        $('.select-recipe').hide();
        flipped = true;
      });

      $('.book-cover').on('click', function () {
        $('.book-cover').css({'transform':'rotateY(180deg) rotateZ(-15deg) skew(-15deg,-15deg)'});
        $('.book-cover').css('background-color','grey');
        $('.book-cover').css('border-style','thick');
        $('.new-page').css({'transform-origin' :'25% 25%'});
      });

      $('.new-page-corner').on('click', function () {
        $('.new-page').css('z-index','14');
        $('.new-page').css({'transform':'rotate(0deg) scale(1, 1)'});
        $('.new-page').css({'transform-origin' :'50% 50%'});
      });

      $('#cancel-edit').on('click', function () {
        $('.new-page').css('z-index','0');
        $('.new-page').css({'transform':'rotate(-5deg) scale(.91, .91)'});
        $('.new-page').css({'transform-origin' :'30% 30%'});
      });

      $('#go-back').on('click', function () {
          $('.get').css({'transform':'rotateY(0deg) rotateZ(0deg) skew(0deg,0deg)'});
          $('.get').css('background-color','blue');
          $('.select-recipe').show();
          flipped = false;
      });

      var moveLeft = 350;
      var triMove = moveLeft+50;

      $('.tri-b').on('click', function () {
        $('.tri-b').css({'transform':'rotateZ(180deg) translateY(150px) translateX('+triMove+'px)'}).hide();
        $('.tri-a').css({'transform':'rotateZ(180deg) translateY(150px) translateX('+triMove+'px)'}).show();
        $('.book').css({'transform':'translateX(-'+moveLeft+'px)'});
        $('.right-side').css({'transform':'translateX(-'+moveLeft+'px)'});
      });

      $('.tri-a').on('click', function () {
        $('.tri-b').css({'transform':'rotateZ(0deg) translateY(-150px) translateX(0px)'}).show();
        $('.tri-a').css({'transform':'rotateZ(0deg) translateY(-150px) translateX(0px)'}).hide();
        $('.book').css({'transform':'translateX(0px)'});
        $('.right-side').css({'transform':'translateX(0px)'});
      });

    }
  };
});

// setTimeout(function () {
//   $('.book').on('click', function () {
//     console.log('clicked with jquery');
//     $('.asdf').css({'transform':'rotateY(0deg)'});
//     $('.asdf').css('background-color','red');
//     $('.page').css({'transform':'rotateY(90deg)'});
//     $('.page').css('background-color','black');
//   });
//
//   $('.meal-plan').on('click', function () {
//     console.log('clicked with jquery');
//     $('.meal-plan').css('background-color','red');
//
//   });
//
//
// }
// ,1000)

angular.module('meals')
.controller('groceryCtrl', ["$scope", "mainService", function ($scope, mainService) {

$scope.groceryList = mainService.groceryList;
console.log('$scope.groceryList: ', $scope.groceryList);
$scope.meatList = [];
$scope.produceList = [];
$scope.dairyList = [];
$scope.cannedList = [];
$scope.bakingList = [];

$scope.choose = function (item, list) {
  $scope.choosen = item;
  $scope.list = eval("$scope."+list);
  $scope.listName = list;
  console.log('$scope.choosen: ', $scope.choosen);
  console.log('$scope.list: ', $scope.list);
  console.log('$scope.listName: ', $scope.listName);
}

$scope.dropHere = function (arr, list) {
  if($scope.choosen){
    console.log('$scope.listName: ', $scope.listName);
    console.log('list: ', list);
    if($scope.listName === list) {
      console.log('already dropped here');
    }
    else {
      arr.push($scope.choosen);
      console.log('arr', arr);
      $scope.list = $scope.list.filter(function( obj ) {
        return obj.qty !== $scope.choosen.qty || obj.measure !== $scope.choosen.measure || obj.name !== $scope.choosen.name;
      });
      if($scope.listName === 'groceryList'){
        $scope.groceryList = $scope.list;
      }
      if($scope.listName === 'meatList'){
        $scope.meatList = $scope.list;
      }
      if($scope.listName === 'produceList'){
        $scope.produceList = $scope.list;
      }
      if($scope.listName === 'dairyList'){
        $scope.dairyList = $scope.list;
      }
      if($scope.listName === 'bakingList'){
        $scope.bakingList = $scope.list;
      }
      if($scope.listName === 'cannedList'){
        $scope.cannedList = $scope.list;
      }

      $scope.choosen = "";
      $scope.listName = list;
    }
  }
}

$scope.print = function () {
  setTimeout(function () {
    window.print();
  },1500)

}



/////////end///////////
}])

angular.module('meals')
.controller('homeCtrl', ["$scope", "mainService", function ($scope, mainService) {


}])

angular.module('meals')
.controller('recipesCtrl', ["$scope", "mainService", "$rootScope", function ($scope, mainService, $rootScope) {
  mainService.refreshUserInfo();
  var userInfo = JSON.parse(localStorage.getItem('recipe-login')) || [];
  $scope.flipped = true;
  $scope.userId = userInfo.id
  $scope.userName = userInfo.name

  $rootScope.$watch("certainRecipe", function (value) {
    $scope.certainRecipe = value;
  });
  $rootScope.$watch("mealList", function (value) {
    $scope.mealList = value;
  });
  // $rootScope.$watch("ingredients", function (value) {
  //   $scope.ingredients = value;
  // });

  $scope.getRecipes = function () {
    mainService.getRecipes()
    .then(function(response) {
      $scope.allRecipes = response.data;
    });
  }

  $scope.rec = "recipe working";

  $scope.mealList = mainService.mealList;





}])

angular.module('meals')
.controller('welcomeCtrl', ["$scope", "mainService", "$state", function ($scope, mainService, $state) {

  $scope.login  = function () {
    console.log('before');
        mainService.login().then(function (response) {
          $scope.logInfo = response;
          console.log('auth0 in ctrl: ', response);
        }).then(function(response) {
          $state.go('recipes');
        });
    }

  $scope.login();  
}])
