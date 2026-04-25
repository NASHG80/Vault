import math

def compute_skill_score(worker_skills, query_skills):
    if not query_skills:
        return 0
    
    match = len(set(worker_skills) & set(query_skills))
    return match / len(query_skills)


def compute_acceptance_rate(accepted, total):
    if total == 0:
        return 0
    return accepted / total


def normalize(value, min_val, max_val):
    if max_val == min_val:
        return 0
    return (value - min_val) / (max_val - min_val)


def location_match(worker_location, job_location):
    return 1 if worker_location == job_location else 0


def safe_divide(a, b):
    return a / b if b != 0 else 0


def sigmoid(x):
    return 1 / (1 + math.exp(-x))