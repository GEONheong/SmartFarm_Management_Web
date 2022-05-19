@echo on
:_loop
set /a temp=%random% %%7+13
set /a temp2=%random% %%30+45
set /a temp3=%random% %%110+300
mosquitto_pub -t tmp -m "{\"tmp\" : %temp%}"
mosquitto_pub -t hum -m "{\"hum\" : %temp2%}"
mosquitto_pub -t Co2 -m "{\"Co2\" : %temp3%}"
timeout /t 3 /nobreak > nul
goto _loop