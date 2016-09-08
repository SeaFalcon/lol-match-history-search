angular.module('Filter', [])

  .filter('resultFilter', function() {
    return function(bool) {
      if(bool){
      	return '승리';
			}else{
				return '패배';
			}
    };
  })

	.filter('typeFilter', function() {
    return function(type) {
			var gameType = '';
      switch(type){
      	case 'BOT_3x3': gameType = 'AI 3:3';
					break;
				case 'NORMAL': gameType = '일반';
					break;
				case 'ARAM_UNRANKED_5x5': gameType = '칼바람';
					break;
				case 'RANKED_SOLO_5x5': gameType = '랭크';
					break;
				case 'CAP_5x5': gameType = '편리';
					break;
				default: return '기타';
			}
			return gameType;
		};
  });
