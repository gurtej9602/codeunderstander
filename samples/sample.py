import os
import sys

# Issue 1: Mutable default argument
def add_user_record(username, user_tags=[]):
    user_tags.append(username)
    return user_tags

def read_config_file(filepath):
    # Issue 2: Resource leak - file opened without 'with' context manager
    f = open(filepath, 'r')
    content = f.read()
    
    # Issue 3: Insecure eval call
    config_dict = eval(content)
    return config_dict

def calculate_average(numbers):
    try:
        total = 0
        # Issue 4: Non-pythonic loop with manual index
        for i in range(len(numbers)):
            total += numbers[i]
        return total / len(numbers)
    except:
        # Issue 5: Bare except clause swallowing all exceptions
        print("An error occurred")
        return 0
