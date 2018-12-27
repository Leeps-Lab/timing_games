from ._builtin import Page, WaitPage

from datetime import timedelta
from operator import concat
from functools import reduce

class Introduction(Page):

    def is_displayed(self):
        return self.round_number == 1


class DecisionWaitPage(WaitPage):
    body_text = 'Waiting for all players to be ready'

    wait_for_all_groups = True

    def is_displayed(self):
        return self.round_number <= self.group.num_rounds()


class Decision(Page):

    def is_displayed(self):
        return self.round_number <= self.group.num_rounds()

class Results(Page):

    def is_displayed(self):
        return self.round_number <= self.group.num_rounds()

page_sequence = [
    Introduction,
    DecisionWaitPage,
    Decision,
    Results
]
