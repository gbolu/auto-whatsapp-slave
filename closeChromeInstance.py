import subprocess as subprocess

def closeChrome():
    temp_subprocess = subprocess.Popen(['ps', '-A'], stdout=subprocess.PIPE)
    output, error = temp_subprocess.communicate()
    print(output)

if __name__ == "__main__":
    closeChrome()