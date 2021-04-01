# -*- coding: utf-8 -*-
"""
Created on Mon Dec  3 23:17:31 2018

@author: Parashar
"""

from whatsapp_utils import AutoWhatsApp
import glob


MESSAGE_TXT = "Here is a test message"


def start_bot():

    whatsbot = AutoWhatsApp("user-data-dir=C:\\Users\\Gbolu\\AppData\\Local\\Google\\Chrome\\User Data\\")    
    phoneNumbers =  ['+2348186511634']

    for number in phoneNumbers:
        whatsbot.hit_api(str(number))
        #####################
        whatsbot.write_text_message("{}".format(MESSAGE_TXT))
        # whatsbot.attach_images()
        #####################

start_bot()
