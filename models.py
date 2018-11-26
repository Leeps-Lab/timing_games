import csv
import random

from django.contrib.contenttypes.models import ContentType
from otree.constants import BaseConstants
from otree.models import BasePlayer, BaseSubsession

from otree_redwood.models import Event, DecisionGroup

doc = """
This is a configurable timing game.
"""

<<<<<<< HEAD
"""In the config, form = 1 if the game type is a pre-emption game, 2 if it is a war of attrition"""
=======
>>>>>>> 19ac99646370aacfa45991abd49587b850e36726

class Constants(BaseConstants):
    name_in_url = 'timing_games'
    players_per_group = 4
	# Maximum number of rounds, actual number is taken as the max round
	# in the config file.
    num_rounds = 100
    base_points = 0


def parse_config(config_file):
    with open('timing_games/configs/' + config_file) as f:
        rows = list(csv.DictReader(f))

    rounds = []
    for row in rows:
        rounds.append({
            'period_length': int(row['period_length']),
<<<<<<< HEAD
            'constantA': int(row['constantA']),
            'constantB': int(row['constantB']),
=======
>>>>>>> 19ac99646370aacfa45991abd49587b850e36726
        })
    return rounds

class Subsession(BaseSubsession):

    def before_session_starts(self):
        config = parse_config(self.session.config['config_file'])
        if self.round_number > len(config):
            return

class Group(DecisionGroup):

    def num_rounds(self):
        return len(parse_config(self.session.config['config_file']))

    def period_length(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['period_length']

<<<<<<< HEAD
    def constantA(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['constantA']

    def constantB(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['constantB']

    """def calc_payoff(self, player):
        decision = self.groupDecisions[player.participant.code]
        position = 0
        for dec in self.groupDecisions:
            if groupDecisions[dec] >= decision:
                position = position + 1
        if(self.form == 1):
            if(position == 1):
                return 100
        if(self.form == 2):
            if(position == len(self.get_players())):
                return 200
        return decision * position * 100"""

=======
>>>>>>> 19ac99646370aacfa45991abd49587b850e36726
class Player(BasePlayer):

    def initial_decision(self):
        return random.random()
<<<<<<< HEAD

    """def set_payoff(self):
        return calc_payoff(self)"""
=======
>>>>>>> 19ac99646370aacfa45991abd49587b850e36726
