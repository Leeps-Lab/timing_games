import csv
import random

from django.contrib.contenttypes.models import ContentType
from django.db.models import FloatField
from otree.constants import BaseConstants
from otree.models import BasePlayer, BaseSubsession

from otree_redwood.models import Event, DecisionGroup

doc = """
This is a configurable timing game.
"""

class Constants(BaseConstants):
    name_in_url = 'timing_games'
    players_per_group = None
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
            'players_per_group': int(row['players_per_group']),
            'enable_payoff_landscape': True if row['enablePayoffLandscape'] == 'TRUE' else False,
            'others_bubbles': str(row['others_bubbles']),
            'constantA': int(row['constantA']),
            'constantB': float(row['constantB']),
            'constantC': float(row['constantC']),
            'constantH': int(row['constantH']),
            'updateRate': int(row['updateRate']),
        })
    return rounds

class Subsession(BaseSubsession):

    def before_session_starts(self):
        config = parse_config(self.session.config['config_file'])
        if self.round_number > len(config):
            return

    def creating_session(self):
        config = parse_config(self.session.config['config_file'])
        if self.round_number > len(config):
            return
        group_matrix = []
        players = self.get_players()
        ppg = parse_config(self.session.config['config_file'])[self.round_number-1]['players_per_group']
        for i in range(0, len(players), ppg):
            group_matrix.append(players[i:i+ppg])
        self.set_group_matrix(group_matrix)

    def enable_payoff_landscape(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['enable_payoff_landscape']

    def others_bubbles(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['others_bubbles']

    def players_per_group(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['players_per_group']


class Group(DecisionGroup):

    def num_rounds(self):
        return len(parse_config(self.session.config['config_file']))

    def period_length(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['period_length']

    def constantA(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['constantA']

    def constantB(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['constantB']

    def constantC(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['constantC']

    def constantH(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['constantH']

    def updateRate(self):
        return parse_config(self.session.config['config_file'])[self.round_number-1]['updateRate']

    def maxPayoff(self):
        sliderMax = 1 + 2 * self.constantA()
        numPlayers = len(self.get_players())
        ux = 1 + (2 * self.constantA() * (sliderMax)/2) - ((sliderMax/2) ** 2)
        uy = (1 - (((numPlayers/2 - 0.5)/numPlayers)/self.constantB())) * (1 + ((numPlayers/2 - 0.5)/numPlayers)/self.constantC())
        return ux * uy

class Player(BasePlayer):
    init_decision = FloatField(null=True)

    def initial_decision(self):
        if not self.init_decision:
            self.init_decision = random.random() * (parse_config(self.session.config['config_file'])[self.round_number-1]['constantA'] * 2 + 1)
            self.save()
        return self.init_decision

    """def set_payoff(self):
        return calc_payoff(self)"""
