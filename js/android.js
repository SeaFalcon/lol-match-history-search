angular.module('riot.controllers', [])

.controller('ApiCtrl', function($scope, $http){
	var apiKey = 'RGAPI-23971B4B-B606-45A7-8096-702B07BD6206';
	$scope.status = '200';

	var champions;
	var items;
	var spells;

	$scope.isActive = [];

	$scope.showDetail = function(matchSummary, idx){
		$scope.isActive[idx] = !$scope.isActive[idx];
		if(!$scope.isActive[idx]) return;

		console.log('matchSummary', matchSummary);
		var endPoint = 'https://kr.api.pvp.net/api/lol/kr/v2.2/match/'+ matchSummary.gameId +'?api_key=' + apiKey;
		$http.get(endPoint).success(function(response){
			$scope.gameDetailInfo = response;
			for(i=0; i<$scope.gameDetailInfo.participants.length; i++){
				var items = [];
				for(j=0; j<matchSummary.fellowPlayers.length; j++){
					if(matchSummary.fellowPlayers[j].championId == $scope.gameDetailInfo.participants[i].championId){
						matchSummary.fellowPlayers[j].spell1 = spells[$scope.gameDetailInfo.participants[i].spell1Id].key;
						matchSummary.fellowPlayers[j].spell2 = spells[$scope.gameDetailInfo.participants[i].spell2Id].key;
						matchSummary.fellowPlayers[j].kill = $scope.gameDetailInfo.participants[i].stats.kills;
						matchSummary.fellowPlayers[j].death = $scope.gameDetailInfo.participants[i].stats.deaths;
						matchSummary.fellowPlayers[j].assist = $scope.gameDetailInfo.participants[i].stats.assists;
						matchSummary.fellowPlayers[j].lv = $scope.gameDetailInfo.participants[i].stats.champLevel;
						items.push($scope.gameDetailInfo.participants[i].stats.item0);
						items.push($scope.gameDetailInfo.participants[i].stats.item1);
						items.push($scope.gameDetailInfo.participants[i].stats.item2);
						items.push($scope.gameDetailInfo.participants[i].stats.item3);
						items.push($scope.gameDetailInfo.participants[i].stats.item4);
						items.push($scope.gameDetailInfo.participants[i].stats.item5);
						items.push($scope.gameDetailInfo.participants[i].stats.item6);
						matchSummary.fellowPlayers[j].items = items;
						matchSummary.fellowPlayers[j].gold = $scope.gameDetailInfo.participants[i].stats.goldEarned;
						matchSummary.fellowPlayers[j].cs = $scope.gameDetailInfo.participants[i].stats.minionsKilled +
						$scope.gameDetailInfo.participants[i].stats.neutralMinionsKilled;
						matchSummary.fellowPlayers[j].deal = $scope.gameDetailInfo.participants[i].stats.totalDamageDealt;
						matchSummary.fellowPlayers[j].champDeal = $scope.gameDetailInfo.participants[i].stats.totalDamageDealtToChampions;
					}
				}
			}
			console.log($scope.gameDetailInfo);

			var fellowPlayers = [];
			for(i=0; i<matchSummary.fellowPlayers.length; i++){
				fellowPlayers.push(matchSummary.fellowPlayers[i].summonerId);
			}
			$http.get('https://kr.api.pvp.net/api/lol/kr/v1.4/summoner/'+fellowPlayers.join()+'/name?api_key='+apiKey)
			.success(function(response){
				for(i=0; i<matchSummary.fellowPlayers.length; i++){
					matchSummary.fellowPlayers[i].name = response[matchSummary.fellowPlayers[i].summonerId];
					matchSummary.fellowPlayers[i].championName = champions[matchSummary.fellowPlayers[i].championId];
				}
			});

			$http.get('https://kr.api.pvp.net/api/lol/kr/v2.5/league/by-summoner/'+ fellowPlayers.join() +'/entry?api_key=' + apiKey).
			success(function(response){
				for(i=0; i<matchSummary.fellowPlayers.length; i++){
					matchSummary.fellowPlayers[i].tier = response[matchSummary.fellowPlayers[i].summonerId][0].tier + ' ' + response[matchSummary.fellowPlayers[i].summonerId][0].entries[0].division;
				}
			});

		});
	};

	$http.get('/android_asset/www/js/static_data.json').success(function(response){
		champions = response.champions;
		items = response.items;
		spells = response.spells;
	});

	$scope.loadUserId = function(sn){

		if($scope.matchSummaries)
			for(i=0; i<$scope.matchSummaries.length; i++)
				$scope.isActive[i] = false;

		var sName = sn.split(' ').join('');
		var endPoint = 'https://kr.api.pvp.net/api/lol/kr/v1.4/summoner/by-name/'+ sn +'?api_key=' + apiKey;

		$http.get(endPoint).success(function(response){
			console.log(response);
			if(response){
				$scope.defaultInfo = response[sName];
				leagueEntry(response[sName].id);
				loadRecentGameList(response[sName].id);
				$scope.status = '200';
				$http.get('https://kr.api.pvp.net/api/lol/kr/v1.3/stats/by-summoner/'+ response[sName].id +'/summary?api_key='+apiKey).success(function(response){
					for(i=0; i<response.playerStatSummaries.length; i++){
						if(response.playerStatSummaries[i].playerStatSummaryType == 'Unranked')
							$scope.normalWin = response.playerStatSummaries[i].wins;
					}
				});
			}else{
			}
		}).error(function(data, status, headers, config){
			console.log(status);
			if(status === 404){
				$scope.status = '';
				$scope.summonerInfo = null;
			}
		});



	};

	function leagueEntry(summonerId){
		var endPoint = 'https://kr.api.pvp.net/api/lol/kr/v2.5/league/by-summoner/'+ summonerId +'/entry?api_key=' + apiKey;
		$http.get(endPoint).success(function(response){
				$scope.summonerInfo = response[summonerId][0];
				console.log(response[summonerId][0]);
		}).error(function(data, status){
			if(status == 404){
				$scope.status = '404';
			}
		});
	}

	function loadRecentGameList(summonerId){
		$scope.matchSummaries = [];
		var endPoint = 'https://kr.api.pvp.net/api/lol/kr/v1.3/game/by-summoner/' + summonerId + '/recent?api_key=' + apiKey;
		$http.get(endPoint).success(function(response){
			console.log('최근게임',response);
			$scope.recentGames = response.games;
			for(var i=0; i<response.games.length; i++){

				var matchSummary = {
					myChamp: 0,
					win: false,
					matchType: '',
					teamId: 0,
					kill: 0,
					death: 0,
					assist: 0,
					items: [],
					spells: [],
					players: {
						team100: [],
						team200: []
					},
					date: '',
					lv: 0,
					gold: 0,
					cs: 0,
					gameTime: 0,
					gameId: 0,
					fellowPlayers: [],
					deal: 0,
					champDeal: 0
				};

				matchSummary.deal = response.games[i].stats.totalDamageDealt;
				matchSummary.champDeal = response.games[i].stats.totalDamageDealtToChampions;
				matchSummary.fellowPlayers = response.games[i].fellowPlayers;
				matchSummary.gameId = response.games[i].gameId;
				matchSummary.gameTime = response.games[i].stats.timePlayed;
				matchSummary.lv = response.games[i].stats.level;
				matchSummary.gold = response.games[i].stats.goldEarned;
				if(response.games[i].stats.neutralMinionsKilled){
					matchSummary.cs = parseInt(response.games[i].stats.minionsKilled) + parseInt(response.games[i].stats.neutralMinionsKilled);
				}else{
					matchSummary.cs = parseInt(response.games[i].stats.minionsKilled);
				}
				matchSummary.myChamp = champions[response.games[i].championId];
				matchSummary.win = response.games[i].stats.win;
				matchSummary.matchType = response.games[i].subType;
				matchSummary.teamId = response.games[i].teamId;
				matchSummary.spells[0] = spells[response.games[i].spell1].key;
				matchSummary.spells[1] = spells[response.games[i].spell2].key;

				matchSummary.items[0] = response.games[i].stats.item0;
				matchSummary.items[1] = response.games[i].stats.item1;
			 	matchSummary.items[2] = response.games[i].stats.item2;
			 	matchSummary.items[3] = response.games[i].stats.item3;
				matchSummary.items[4] = response.games[i].stats.item4;
				matchSummary.items[5] = response.games[i].stats.item5;
				matchSummary.items[6] = response.games[i].stats.item6;


				if(response.games[i].stats.championsKilled) matchSummary.kill = response.games[i].stats.championsKilled;
				if(response.games[i].stats.numDeaths) matchSummary.death = response.games[i].stats.numDeaths;
				if(response.games[i].stats.assists) matchSummary.assist = response.games[i].stats.assists;

				if(response.games[i].fellowPlayers){
					for(j=0; j<response.games[i].fellowPlayers.length; j++){
						if(response.games[i].fellowPlayers[j].teamId == 100){
							matchSummary.players.team100.push(champions[response.games[i].fellowPlayers[j].championId]);
						}else{
							matchSummary.players.team200.push(champions[response.games[i].fellowPlayers[j].championId]);
						}
					}
				}
				matchSummary.date = response.games[i].createDate;
				$scope.matchSummaries.push(matchSummary);
				//loadMatchInfo(response.games[i].gameId);
			}
			console.log($scope.matchSummaries);

		}).error(function(data, status){});
	}


	function loadMatchInfo(matchId){
		var endPoint = 'https://kr.api.pvp.net/api/lol/kr/v2.2/match/' + matchId + '?api_key=' + apiKey;
		$http.get(endPoint).success(function(response){
			$scope.matchList.push(response.games);
		}).error(function(data, status){

		});
	}

});
