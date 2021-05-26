import subprocess, os, sys

def findProcessPid(target_process):
    temp_subprocess = subprocess.Popen(['ps', '-aux'], stdout=subprocess.PIPE)
    output, error = temp_subprocess.communicate()

    if error:
        print(error)

    for line in output.splitlines():
        if target_process in str(line):
            pid = (str(line).split(' '))
            pid = [p for p in pid if p is not '']
            pid = pid[1]
            return int(pid)

def closeProcess(pid):
    os.kill(pid, 9)

if __name__ == "__main__":
    target_process = sys.argv[1]
    pid = findProcessPid(target_process)
    closeProcess(pid)