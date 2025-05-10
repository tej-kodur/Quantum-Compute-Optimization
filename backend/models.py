class SummaryResponse:
    def __init__(self, total_blocks, blocks_by_type, total_workloads, 
                 average_cost_per_day, cost_savings_percentage, recommendation):
        self.total_blocks = total_blocks
        self.blocks_by_type = blocks_by_type
        self.total_workloads = total_workloads
        self.average_cost_per_day = average_cost_per_day
        self.cost_savings_percentage = cost_savings_percentage
        self.recommendation = recommendation
    
    def to_dict(self):
        """Convert class instance to dictionary for JSON response"""
        return {
            "total_blocks": str(self.total_blocks),
            "blocks_by_type": self.blocks_by_type,
            "total_workloads": str(self.total_workloads),
            "average_cost_per_day": str(self.average_cost_per_day),
            "cost_savings_percentage": int(self.cost_savings_percentage),
            "recommendation": self.recommendation
        }
    
class ChatResponse:
    def __init__(self, response, image):
        self.response = response
        self.image = image